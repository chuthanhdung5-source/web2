import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.middleware.auth import get_current_user
from app.config import settings
from app.schemas.chat import ChatRequest, ChatResponse, ChatSuggestionsResponse
from app.services.chat_functions import get_available_tools_for_user, execute_tool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat Assistant"])


@router.get("/suggestions", response_model=ChatSuggestionsResponse)
def get_chat_suggestions(current_user: User = Depends(get_current_user)):
    """Trả về danh sách câu hỏi gợi ý nhanh phù hợp với Role của người dùng."""
    if current_user.role == UserRole.admin:
        suggestions = [
            "Hôm nay có những ca học nào cần duyệt?",
            "Có bao nhiêu ảnh check-in tiết học đang chờ duyệt?",
            "Tổng quan tình hình tài chính và thanh toán hiện tại?",
            "Xem danh sách các ca học mở trong tuần này",
            "Ai là những thành viên có thu nhập cao nhất?",
            "Xem các góp ý hoặc phản ánh mới nhất của thành viên"
        ]
    else:
        suggestions = [
            "Tuần này tôi có những ca học nào đã được duyệt?",
            "Hiện tại có ca học nào đang mở đăng ký không?",
            "Xem thông tin sinh viên của Admin để đi học hộ",
            "Tổng thu nhập và lịch sử nhận lương của tôi?",
            "Kiểm tra trạng thái các tiết tôi đã check-in gần đây",
            "Tóm tắt thống kê hoạt động học hộ của tôi"
        ]

    return ChatSuggestionsResponse(
        role=current_user.role.value,
        suggestions=suggestions
    )


@router.post("/ask", response_model=ChatResponse)
def ask_ai_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint xử lý câu hỏi hỏi đáp dữ liệu trong hệ thống sử dụng OpenAI API & Function Calling."""
    api_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""

    # Kiểm tra nếu chưa cấu hình OpenAI API Key
    if not api_key:
        return ChatResponse(
            answer=(
                "⚠️ **Chưa cấu hình OpenAI API Key!**\n\n"
                "Hệ thống đã chuẩn bị sẵn toàn bộ kiến trúc AI Agent và bảo mật phân quyền. "
                "Quản trị viên vui lòng thêm cấu hình `OPENAI_API_KEY=sk-...` vào file `.env` "
                "ở thư mục gốc rồi khởi động lại backend để kích hoạt trí tuệ nhân tạo."
            ),
            sources=["Cấu hình hệ thống (.env)"],
            suggestions=[
                "Làm sao để cấu hình OpenAI API Key?",
                "Hệ thống hỗ trợ những tính năng tra cứu gì?"
            ]
        )

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể khởi tạo OpenAI client: {str(e)}"
        )

    # 1. Chuẩn bị system prompt với thông tin người dùng và quy định bảo mật
    is_admin = (current_user.role == UserRole.admin)
    system_prompt = f"""Bạn là Trợ lý AI Thông Minh của hệ thống 'Web Học Hộ' (Đấu La Đại Khảo Chi Lưới).
Nhiệm vụ của bạn là hỗ trợ người dùng tra cứu thông tin nhanh chóng, chính xác về:
- Lịch học, ca học trong tuần, phòng học, tiết học, môn học.
- Trạng thái check-in ảnh điểm danh từng tiết học.
- Lịch sử tiền lương, thanh toán học hộ, thông tin tài khoản ngân hàng.
- Thông tin sinh viên học hộ của Admin (mã SV, ngành, lớp, trường) để thành viên biết đi học hộ cho ai.
- Góp ý/phản ánh (Feedback) và các hoạt động hệ thống.

THÔNG TIN NGƯỜI DÙNG HIỆN TẠI:
- Họ và tên: {current_user.full_name}
- Tên đăng nhập: {current_user.username}
- Vai trò (Role): {'Quản trị viên (Admin)' if is_admin else 'Thành viên (Member)'}

QUY TẮC BẢO MẬT & TRUY VẤN (BẮT BUỘC TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG tự bịa đặt số liệu hoặc thông tin. Hãy luôn gọi Function Calling Tools được cung cấp để truy vấn dữ liệu thực tế từ cơ sở dữ liệu trước khi trả lời.
2. PHÂN QUYỀN CHẶT CHẼ:
   - Nếu người dùng là 'Member': Họ CHỈ ĐƯỢC PHÉP xem ca học của chính họ (hoặc ca mở đăng ký), check-in của chính họ, thu nhập/thanh toán của chính họ, và feedback của chính họ.
   - Nếu Member hỏi thông tin cá nhân của người khác (như danh sách thành viên, lương người khác, số điện thoại, log admin...), hãy TỪ CHỐI LỊCH SỰ và giải thích rằng quyền riêng tư chỉ cho phép Admin xem dữ liệu này.
   - Nếu là 'Admin': Có toàn quyền xem toàn bộ ca học, danh sách thành viên, duyệt ca, check-in, tổng thu nhập và audit logs.
3. PHONG CÁCH TRẢ LỜI:
   - Luôn trả lời bằng tiếng Việt lịch sự, thân thiện, rõ ràng, gãy gọn.
   - Sử dụng định dạng Markdown (in đậm, danh sách bullet `-`, bảng biểu nếu thích hợp) để người dùng dễ đọc.
   - Kết thúc câu trả lời một cách tự nhiên và có thể gợi ý ngắn gọn bước tiếp theo.
"""

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_prompt}
    ]

    # Nạp lịch sử chat gần nhất (tối đa 8 tin để tối ưu token)
    recent_history = payload.history[-8:] if payload.history else []
    for h in recent_history:
        if h.role in ["user", "assistant"]:
            messages.append({"role": h.role, "content": h.content})

    # Thêm câu hỏi hiện tại
    messages.append({"role": "user", "content": payload.message})

    # Lấy danh sách tools tương ứng với quyền của user
    tools = get_available_tools_for_user(current_user)

    sources_used = set()

    try:
        # Gọi OpenAI lần 1
        model_name = settings.OPENAI_MODEL or "gpt-4o-mini"
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None,
            temperature=0.3,
            max_tokens=1000,
        )

        response_message = response.choices[0].message

        # Kiểm tra xem OpenAI có yêu cầu gọi Tool/Function không
        if response_message.tool_calls:
            messages.append(response_message)

            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except Exception:
                    function_args = {}

                # Thực thi hàm truy vấn dữ liệu từ DB
                function_result = execute_tool(
                    db=db,
                    user=current_user,
                    tool_name=function_name,
                    tool_args=function_args
                )

                if "source" in function_result:
                    sources_used.add(function_result["source"])

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": json.dumps(function_result, ensure_ascii=False)
                })

            # Gọi OpenAI lần 2 để tổng hợp câu trả lời từ dữ liệu tool
            second_response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )
            final_answer = second_response.choices[0].message.content or "Tôi không thể tạo câu trả lời lúc này."
        else:
            final_answer = response_message.content or "Tôi đã nhận được câu hỏi nhưng chưa có dữ liệu phản hồi."

        # Tạo gợi ý tiếp theo ngắn gọn
        suggested_followups = []
        if is_admin:
            suggested_followups = [
                "Kiểm tra lại ca học hôm nay",
                "Xem thống kê thanh toán",
                "Xem thành viên mới"
            ]
        else:
            suggested_followups = [
                "Xem ca học khả dụng tuần này",
                "Xem tổng thu nhập của tôi",
                "Thông tin sinh viên Admin"
            ]

        return ChatResponse(
            answer=final_answer,
            sources=list(sources_used) if sources_used else ["Kiến thức hệ thống Web Học Hộ"],
            suggestions=suggested_followups
        )

    except Exception as e:
        logger.error(f"Error calling OpenAI API: {e}", exc_info=True)
        return ChatResponse(
            answer=f"⚠️ **Đã xảy ra lỗi khi kết nối với OpenAI AI Agent:**\n\n`{str(e)}`\n\nVui lòng kiểm tra lại API Key hoặc đường truyền mạng.",
            sources=["Hệ thống xử lý ngoại lệ"],
            suggestions=["Thử lại câu hỏi", "Kiểm tra kết nối"]
        )
