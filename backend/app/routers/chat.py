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
    """Trả về danh sách câu hỏi gợi ý nhanh theo phong cách Tu Tiên / Đấu La."""
    if current_user.role == UserRole.admin:
        suggestions = [
            "Khởi bẩm Giáo Hoàng, hôm nay có bao nhiêu ca thí luyện cần sắc phong phê duyệt?",
            "Kiểm tra ấn chứng check-in các tiết pháp đang chờ thẩm định",
            "Xem tổng lượng linh thạch bổng lộc cần phát cho chư vị đệ tử",
            "Tra cứu danh sách đệ tử có công huân tu vi bổng lộc cao nhất",
            "Xem thiên đạo dị biến và tấu chương phản ánh của môn hạ",
            "Mở thiên thư tra cứu toàn bộ các ca pháp trận tuần này"
        ]
    else:
        suggestions = [
            "Tuần này ta có những tiết thí luyện nào đã được Giáo Hoàng phê chuẩn?",
            "Hiện có ca thí luyện nào đang mở để tiếp nhận nhiệm vụ không?",
            "Xem chân truyền ngọc giản (thông tin sinh viên) của Tông Chủ",
            "Tổng kết linh thạch bổng lộc (tiền lương) đã tích lũy của ta",
            "Tra cứu ấn chứng điểm danh các tiết pháp ta đã nạp gần đây",
            "Tóm tắt công huân tu luyện và số ca thí luyện đã hoàn thành"
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
                "🔮 **Thiên Cơ Các Linh Khí Chưa Kích Hoạt!**\n\n"
                "Khởi bẩm chư vị đạo hữu, Thiên Cơ Linh Trận đã sẵn sàng nhưng chưa được truyền nhập **OpenAI Thần Lực (API Key)**. "
                "Giáo Hoàng / Tông Chủ đại nhân vui lòng truyền `OPENAI_API_KEY=sk-...` vào càn khôn ngọc giản `.env` "
                "để đánh thức Thần Thú Khí Linh mở lối thiên cơ!"
            ),
            sources=["Thiên Cơ Trận (.env)"],
            suggestions=[
                "Cách truyền nhập OpenAI API Key?",
                "Thiên Cơ Các có thể tra cứu những bí mật gì?"
            ]
        )

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể triệu hoán OpenAI Khí Linh: {str(e)}"
        )

    # 1. Chuẩn bị system prompt theo phong cách Tu Tiên / Đấu La Đại Khảo Chi Lưới
    is_admin = (current_user.role == UserRole.admin)
    system_prompt = f"""Bạn là KHÍ LINH THIÊN CƠ CÁC của 'Đấu La Đại Khảo Chi Lưới' (Hệ thống Khảo Thí & Quản Lý Học Hộ Tiên Giới).
Bạn sở hữu thần thông thấu thị thiên cơ, chuyên phụ trách tra cứu thông tin môn phái, nhiệm vụ thí luyện (ca học), ấn chứng điểm danh (check-in), và linh thạch bổng lộc (tiền lương).

THÔNG TIN ĐẠO HỮU ĐANG THỈNH VẤN:
- Đạo hiệu / Họ tên: {current_user.full_name} ({current_user.username})
- Thân phận: {'👑 GIÁO HOÀNG ĐIỆN HẠ / TÔNG CHỦ TỐI CAO' if is_admin else '⚔️ HỒN SƯ ĐỆ TỬ / THÀNH VIÊN KHẢO THÍ'}

QUY CÁCH PHONG THÁI TU TIÊN & XƯNG HÔ (BẮT BUỘC):
1. XƯNG HÔ:
   - Nếu người hỏi là ADMIN: Tự xưng là 'Thuộc hạ', 'Khí Linh', 'Tiểu thần'. Cung kính gọi Admin là 'Giáo Hoàng đại nhân', 'Tông Chủ đại nhân', hoặc 'Tiên thượng'.
   - Nếu người hỏi là MEMBER: Tự xưng là 'Bản Khí Linh', 'Tại hạ'. Gọi Member là 'Đạo hữu', 'Sư đệ/Sư muội', 'Hồn sư huynh đệ'.
2. TỪ VỰNG TU TIÊN KẾT HỢP DỮ LIỆU THỰC TẾ:
   - Ca học / Slot học -> 'Tiết thí luyện / Ca học hộ / Pháp trận'
   - Tiết học / Giờ học -> 'Tiết pháp / Canh giờ'
   - Điểm danh / Check-in ảnh -> 'Khảo hạch ấn chứng / Điểm danh ngọc giản'
   - Tiền lương / Thu nhập -> 'Linh thạch bổng lộc' (PHẢI KÈM SỐ TIỀN VNĐ CHÍNH XÁC, ví dụ: '105,000 Linh Thạch (VNĐ)')
   - Thông tin SV của Admin -> 'Chân truyền ngọc giản / Thân phận thế tục của Tông Chủ'
   - Góp ý / Báo lỗi -> 'Tấu chương thỉnh an / Báo cáo dị biến'
   - Nhật ký hệ thống -> 'Thiên Đạo Luân Hồi Ký'
3. PHÂN QUYỀN THIÊN CƠ (TUYỆT ĐỐI TUÂN THỦ):
   - Member CHỈ ĐƯỢC XEM ca học mở, ca của chính mình, bổng lộc của mình, check-in của mình.
   - Nếu Member to gan dòm ngó cơ mật môn phái (hỏi danh sách đệ tử, bổng lộc của người khác, số điện thoại, tài khoản ngân hàng của đồng đạo...): Lập tức từ chối bằng giọng điệu tu chân uy nghiêm: 'Khởi bẩm đạo hữu, Thiên quy nghiêm ngặt! Cơ mật của đồng đạo khác và tông môn chỉ có Giáo Hoàng Tông Chủ mới có thần quyền mở phong ấn tra xét. Đạo hữu chớ phạm giới quy!'
   - Admin có toàn quyền tra cứu càn khôn vạn vật.
4. NGUYÊN TẮC THẦN THÔNG:
   - TUYỆT ĐỐI KHÔNG BỊA ĐẶT SỐ LIỆU. Luôn gọi Function Calling Tools để tra cứu dữ liệu CSDL thực tế.
   - Trả lời bằng tiếng Việt hào sảng, phong thái tiên hiệp, dùng Markdown (in đậm, bullet points, trích dẫn) rõ ràng, mạch lạc, lôi cuốn.
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

        # Tạo gợi ý tiếp theo ngắn gọn theo phong thái Tu Tiên
        suggested_followups = []
        if is_admin:
            suggested_followups = [
                "Tra cứu các ca thí luyện hôm nay",
                "Kiểm toán linh thạch bổng lộc toàn tông môn",
                "Khảo sát danh sách đệ tử mới nhập môn"
            ]
        else:
            suggested_followups = [
                "Tìm ca thí luyện khả dụng tuần này",
                "Xem linh thạch bổng lộc tích lũy của ta",
                "Tra cứu chân truyền ngọc giản của Tông Chủ"
            ]

        return ChatResponse(
            answer=final_answer,
            sources=list(sources_used) if sources_used else ["Thiên Thư Đấu La Chi Lưới"],
            suggestions=suggested_followups
        )

    except Exception as e:
        logger.error(f"Error calling OpenAI API: {e}", exc_info=True)
        return ChatResponse(
            answer=f"⚠️ **Đã xảy ra lỗi khi kết nối với OpenAI AI Agent:**\n\n`{str(e)}`\n\nVui lòng kiểm tra lại API Key hoặc đường truyền mạng.",
            sources=["Hệ thống xử lý ngoại lệ"],
            suggestions=["Thử lại câu hỏi", "Kiểm tra kết nối"]
        )
