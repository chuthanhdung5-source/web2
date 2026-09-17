"""Service cung cấp các hàm nghiệp vụ phục vụ AI Agent (OpenAI Function Calling)
Có cơ chế phân quyền chặt chẽ:
- Member: Chỉ được truy vấn dữ liệu của chính mình (ca học của mình, check-in của mình, thu nhập của mình, feedback của mình, ca mở đăng ký, profile SV học hộ).
- Admin: Được truy vấn toàn bộ dữ liệu hệ thống (danh sách thành viên, tổng hợp thanh toán, logs hoạt động, duyệt ca, thống kê tổng).
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc
from app.models import (
    User, UserRole, WeeklySession, SessionStatus,
    ScheduleSlot, Subject, Semester, PeriodCheckin, CheckinStatus,
    Payment, PaymentStatus, Feedback, ActivityLog, AdminProfile,
    SessionRegistration, RegistrationStatus
)


def get_available_tools_for_user(user: User) -> List[Dict[str, Any]]:
    """Trả về danh sách Function Calling Tools mà role của user được phép gọi."""
    is_admin = (user.role == UserRole.admin)

    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_sessions",
                "description": (
                    "Tìm kiếm danh sách ca học theo điều kiện. "
                    "Member chỉ xem được ca mở đăng ký (open) hoặc ca do chính mình đăng ký/phụ trách. "
                    "Admin có thể xem toàn bộ ca học của bất kỳ ai."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["open", "registered", "approved", "in_progress", "completed", "cancelled"],
                            "description": "Trạng thái ca học cần lọc"
                        },
                        "date_from": {
                            "type": "string",
                            "description": "Ngày bắt đầu định dạng YYYY-MM-DD"
                        },
                        "date_to": {
                            "type": "string",
                            "description": "Ngày kết thúc định dạng YYYY-MM-DD"
                        },
                        "subject_name": {
                            "type": "string",
                            "description": "Tên môn học hoặc mã môn học cần tìm"
                        },
                        "only_mine": {
                            "type": "boolean",
                            "description": "Chỉ lấy các ca của chính người dùng này (mặc định True với member)"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_admin_student_profile",
                "description": "Xem thông tin sinh viên học hộ của Admin (họ tên SV, mã SV, lớp, ngành, trường, ghi chú dặn dò khi đi học hộ). Dùng cho cả Admin và Member.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_my_earnings_and_payments",
                "description": "Xem thông tin thu nhập và lịch sử thanh toán tiền công học hộ. Member xem của chính mình, Admin có thể tra cứu chung hoặc theo từng member.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["pending", "paid"],
                            "description": "Trạng thái thanh toán (chờ thanh toán hoặc đã thanh toán)"
                        },
                        "member_id": {
                            "type": "integer",
                            "description": "ID thành viên cần tra cứu (chỉ Admin mới có quyền dùng tham số này)"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_checkin_records",
                "description": "Xem danh sách check-in ảnh điểm danh từng tiết học. Member xem của mình, Admin có thể lọc các checkin đang chờ duyệt (pending) của toàn bộ hệ thống.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["pending", "verified", "rejected", "missed"],
                            "description": "Trạng thái checkin cần lọc"
                        },
                        "session_id": {
                            "type": "integer",
                            "description": "ID của ca học cụ thể nếu muốn tra cứu"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_feedbacks",
                "description": "Xem danh sách góp ý/báo lỗi. Member chỉ xem của chính mình kèm lời phản hồi của Admin. Admin xem toàn bộ góp ý từ các thành viên.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["pending", "replied", "resolved"],
                            "description": "Trạng thái góp ý"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_overview_stats",
                "description": "Xem báo cáo thống kê tổng quan. Member xem thống kê cá nhân (số ca làm, thu nhập, số tiết). Admin xem thống kê toàn bộ hệ thống.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        }
    ]

    # Các công cụ đặc quyền riêng chỉ dành cho Admin
    if is_admin:
        tools.extend([
            {
                "type": "function",
                "function": {
                    "name": "admin_search_members",
                    "description": "[ADMIN ONLY] Tra cứu danh sách thành viên trong hệ thống (tên, email, số điện thoại, ngân hàng, thu nhập, trạng thái hoạt động).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "keyword": {
                                "type": "string",
                                "description": "Tên, username hoặc email của thành viên"
                            },
                            "is_active": {
                                "type": "boolean",
                                "description": "Lọc thành viên còn hoạt động hay không"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "admin_get_activity_logs",
                    "description": "[ADMIN ONLY] Xem lịch sử nhật ký hoạt động gần đây của hệ thống (audit logs: duyệt ca, upload ảnh, sửa đổi, thanh toán...).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action_type": {
                                "type": "string",
                                "description": "Loại hành động cần lọc (ví dụ: APPROVE_SESSION, REJECT_CHECKIN, PAYMENT, etc.)"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Số lượng bản ghi tối đa (mặc định 15)"
                            }
                        }
                    }
                }
            }
        ])

    return tools


def execute_tool(
    db: Session,
    user: User,
    tool_name: str,
    tool_args: Dict[str, Any]
) -> Dict[str, Any]:
    """Thực thi function call với kiểm tra bảo mật role chặt chẽ."""
    is_admin = (user.role == UserRole.admin)

    # 1. Search Sessions
    if tool_name == "search_sessions":
        query = db.query(WeeklySession).join(ScheduleSlot).join(Subject)

        status = tool_args.get("status")
        if status:
            query = query.filter(WeeklySession.status == status)

        date_from = tool_args.get("date_from")
        if date_from:
            try:
                d_from = datetime.strptime(date_from, "%Y-%m-%d").date()
                query = query.filter(WeeklySession.session_date >= d_from)
            except Exception:
                pass

        date_to = tool_args.get("date_to")
        if date_to:
            try:
                d_to = datetime.strptime(date_to, "%Y-%m-%d").date()
                query = query.filter(WeeklySession.session_date <= d_to)
            except Exception:
                pass

        subject_name = tool_args.get("subject_name")
        if subject_name:
            query = query.filter(
                or_(
                    Subject.name.ilike(f"%{subject_name}%"),
                    Subject.code.ilike(f"%{subject_name}%")
                )
            )

        # Quyền hạn dữ liệu
        only_mine = tool_args.get("only_mine", False)
        if not is_admin or only_mine:
            # Member chỉ xem ca mở hoặc ca của chính mình
            if not is_admin:
                query = query.filter(
                    or_(
                        WeeklySession.status == SessionStatus.open,
                        WeeklySession.assigned_member_id == user.id,
                        WeeklySession.registrations.any(SessionRegistration.member_id == user.id)
                    )
                )
            else:
                query = query.filter(WeeklySession.assigned_member_id == user.id)

        sessions = query.order_by(WeeklySession.session_date.asc()).limit(20).all()

        results = []
        for s in sessions:
            slot = s.schedule_slot
            subj = slot.subject if slot else None
            assigned_name = s.assigned_member.full_name if s.assigned_member else None
            # Nếu là member, che tên người khác nếu không phải chính mình
            if not is_admin and s.assigned_member_id != user.id:
                assigned_name = "Thành viên khác" if s.assigned_member_id else "Chưa có"

            results.append({
                "session_id": s.id,
                "session_date": s.session_date.isoformat(),
                "subject": f"{subj.name} ({subj.code})" if subj else "N/A",
                "room": slot.room if slot else "N/A",
                "time": slot.time_range if slot else "N/A",
                "periods": f"Tiết {slot.start_period} - {slot.end_period}" if slot else "N/A",
                "status": s.status.value,
                "assigned_to": assigned_name,
                "notes": s.notes or ""
            })

        return {
            "source": "weekly_sessions & schedule_slots",
            "count": len(results),
            "sessions": results
        }

    # 2. Get Admin Student Profile
    elif tool_name == "get_admin_student_profile":
        profile = db.query(AdminProfile).first()
        if not profile:
            return {"source": "admin_profiles", "message": "Chưa có thông tin sinh viên học hộ được cấu hình."}
        return {
            "source": "admin_profiles",
            "student_name": profile.full_name,
            "student_id": profile.student_id,
            "class_name": profile.class_name,
            "major": profile.major,
            "university": profile.university,
            "faculty": profile.faculty,
            "notes": profile.notes
        }

    # 3. Get Earnings and Payments
    elif tool_name == "get_my_earnings_and_payments":
        target_member_id = user.id
        if is_admin and tool_args.get("member_id"):
            target_member_id = tool_args.get("member_id")

        target_user = db.query(User).filter(User.id == target_member_id).first()
        if not target_user:
            return {"error": "Không tìm thấy thông tin thành viên."}

        # Query payments
        p_query = db.query(Payment).filter(Payment.member_id == target_member_id)
        if tool_args.get("status"):
            p_query = p_query.filter(Payment.status == tool_args.get("status"))

        payments = p_query.order_by(desc(Payment.id)).limit(15).all()
        payment_list = []
        for p in payments:
            payment_list.append({
                "payment_id": p.id,
                "session_id": p.weekly_session_id,
                "periods_completed": p.periods_completed,
                "amount": p.amount,
                "status": p.status.value,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "notes": p.notes or ""
            })

        return {
            "source": "users & payments",
            "member_name": target_user.full_name,
            "total_earnings_vnd": target_user.total_earnings,
            "bank_info": {
                "bank_name": target_user.bank_name or "Chưa cài đặt",
                "bank_account_no": target_user.bank_account_no or "Chưa cài đặt",
                "bank_account_name": target_user.bank_account_name or "Chưa cài đặt"
            },
            "recent_payments": payment_list
        }

    # 4. Get Checkin Records
    elif tool_name == "get_checkin_records":
        query = db.query(PeriodCheckin).join(WeeklySession)

        session_id = tool_args.get("session_id")
        if session_id:
            query = query.filter(PeriodCheckin.weekly_session_id == session_id)

        status = tool_args.get("status")
        if status:
            query = query.filter(PeriodCheckin.status == status)

        # Phân quyền: Member chỉ xem checkin của ca học được giao cho mình
        if not is_admin:
            query = query.filter(WeeklySession.assigned_member_id == user.id)

        checkins = query.order_by(desc(PeriodCheckin.id)).limit(20).all()
        results = []
        for c in checkins:
            results.append({
                "checkin_id": c.id,
                "session_id": c.weekly_session_id,
                "period_number": c.period_number,
                "status": c.status.value,
                "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
                "reject_reason": c.reject_reason or "",
                "has_photo": bool(c.photo_url)
            })

        return {
            "source": "period_checkins",
            "count": len(results),
            "checkins": results
        }

    # 5. Get Feedbacks
    elif tool_name == "get_feedbacks":
        query = db.query(Feedback)
        if not is_admin:
            query = query.filter(Feedback.user_id == user.id)

        status = tool_args.get("status")
        if status:
            query = query.filter(Feedback.status == status)

        feedbacks = query.order_by(desc(Feedback.id)).limit(15).all()
        results = []
        for f in feedbacks:
            results.append({
                "feedback_id": f.id,
                "type": f.type.value if hasattr(f.type, "value") else str(f.type),
                "title": f.title,
                "content": f.content,
                "status": f.status.value if hasattr(f.status, "value") else str(f.status),
                "admin_reply": f.admin_reply or "Chưa có phản hồi",
                "created_at": f.created_at.isoformat() if f.created_at else None
            })

        return {
            "source": "feedbacks",
            "count": len(results),
            "feedbacks": results
        }

    # 6. Overview Stats
    elif tool_name == "get_overview_stats":
        if is_admin:
            total_members = db.query(User).filter(User.role == UserRole.member).count()
            open_sessions = db.query(WeeklySession).filter(WeeklySession.status == SessionStatus.open).count()
            pending_approvals = db.query(WeeklySession).filter(WeeklySession.status == SessionStatus.registered).count()
            pending_checkins = db.query(PeriodCheckin).filter(PeriodCheckin.status == CheckinStatus.pending).count()
            pending_payments_amount = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.pending).scalar()
            paid_payments_amount = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.paid).scalar()

            return {
                "source": "system_wide_stats",
                "role": "admin",
                "total_members": total_members,
                "open_sessions_count": open_sessions,
                "pending_approval_sessions": pending_approvals,
                "pending_checkins_to_review": pending_checkins,
                "pending_payments_total_vnd": float(pending_payments_amount or 0),
                "paid_payments_total_vnd": float(paid_payments_amount or 0)
            }
        else:
            my_sessions_count = db.query(WeeklySession).filter(WeeklySession.assigned_member_id == user.id).count()
            completed_sessions = db.query(WeeklySession).filter(
                WeeklySession.assigned_member_id == user.id,
                WeeklySession.status == SessionStatus.completed
            ).count()
            pending_checkins = db.query(PeriodCheckin).join(WeeklySession).filter(
                WeeklySession.assigned_member_id == user.id,
                PeriodCheckin.status == CheckinStatus.pending
            ).count()

            return {
                "source": "member_personal_stats",
                "role": "member",
                "member_name": user.full_name,
                "total_earnings_vnd": user.total_earnings,
                "assigned_sessions_total": my_sessions_count,
                "completed_sessions": completed_sessions,
                "pending_checkins": pending_checkins
            }

    # 7. Admin Search Members (Admin Only)
    elif tool_name == "admin_search_members":
        if not is_admin:
            return {"error": "Quyền truy cập bị từ chối. Chỉ Quản trị viên mới có thể xem danh sách thành viên."}

        query = db.query(User).filter(User.role == UserRole.member)
        keyword = tool_args.get("keyword")
        if keyword:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{keyword}%"),
                    User.username.ilike(f"%{keyword}%"),
                    User.email.ilike(f"%{keyword}%")
                )
            )

        is_active = tool_args.get("is_active")
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        members = query.order_by(desc(User.total_earnings)).limit(20).all()
        results = []
        for m in members:
            results.append({
                "id": m.id,
                "username": m.username,
                "full_name": m.full_name,
                "email": m.email,
                "phone": m.phone or "Chưa có",
                "is_active": m.is_active,
                "total_earnings": m.total_earnings,
                "bank_name": m.bank_name or "Chưa có",
                "bank_account_no": m.bank_account_no or "Chưa có"
            })

        return {
            "source": "users (admin_view)",
            "count": len(results),
            "members": results
        }

    # 8. Admin Activity Logs (Admin Only)
    elif tool_name == "admin_get_activity_logs":
        if not is_admin:
            return {"error": "Quyền truy cập bị từ chối. Chỉ Quản trị viên mới xem được nhật ký hoạt động."}

        query = db.query(ActivityLog)
        action_type = tool_args.get("action_type")
        if action_type:
            query = query.filter(ActivityLog.action_type == action_type)

        limit = min(tool_args.get("limit", 15), 50)
        logs = query.order_by(desc(ActivityLog.created_at)).limit(limit).all()

        results = []
        for l in logs:
            results.append({
                "action": l.action_type,
                "user_name": l.user_name,
                "user_role": l.user_role,
                "title": l.title,
                "description": l.description,
                "time": l.created_at.isoformat() if l.created_at else None
            })

        return {
            "source": "activity_logs",
            "count": len(results),
            "logs": results
        }

    return {"error": f"Không hỗ trợ chức năng '{tool_name}'."}
