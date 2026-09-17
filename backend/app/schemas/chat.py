from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessageItem(BaseModel):
    role: str = Field(..., description="Role của người gửi: 'user' hoặc 'assistant'")
    content: str = Field(..., description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Câu hỏi hoặc yêu cầu của người dùng")
    history: List[ChatMessageItem] = Field(default_factory=list, description="Lịch sử các tin nhắn gần nhất")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Câu trả lời từ AI Agent")
    sources: List[str] = Field(default_factory=list, description="Các nguồn dữ liệu/bảng đã dùng để trả lời")
    suggestions: List[str] = Field(default_factory=list, description="Gợi ý các câu hỏi tiếp theo")


class ChatSuggestionsResponse(BaseModel):
    role: str
    suggestions: List[str]
