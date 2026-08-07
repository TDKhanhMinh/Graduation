import type { GuidedTourConfig } from "./types"
import { TOUR_TARGET_MATRIX } from "./types"

export const defaultTourConfig: GuidedTourConfig = {
  version: "v1",
  steps: [
    {
      id: "intro",
      title: "Chào mừng bạn!",
      content: "Tôi là trợ lý ảo của sự kiện. Hãy để tôi hướng dẫn bạn qua một vài điểm nổi bật của thiệp mời này nhé.",
      targetSelector: null,
      condition: "always",
      mascotAction: "wave",
      speech: "Chào mừng! Bạn đã sẵn sàng khám phá chưa?"
    },
    {
      id: "title",
      title: "Chủ đề sự kiện",
      content: "Đây là tên chính thức của sự kiện. Đừng quên lưu lại thời gian và địa điểm tổ chức nha.",
      targetSelector: TOUR_TARGET_MATRIX.title,
      condition: "always",
      mascotAction: "point-to-content",
      speech: "Đây là sự kiện chúng ta sẽ tham gia!"
    },
    {
      id: "countdown",
      title: "Thời gian còn lại",
      content: "Đồng hồ đếm ngược sẽ cho bạn biết chính xác khi nào sự kiện bắt đầu. Đừng bỏ lỡ nhé!",
      targetSelector: TOUR_TARGET_MATRIX.countdown,
      condition: "has-countdown",
      mascotAction: "idle",
      speech: "Sắp đến giờ rồi!"
    },
    {
      id: "submit-wish",
      title: "Gửi lời chúc",
      content: "Bạn có thể viết lời chúc và gửi tặng chủ nhân sự kiện. Những lời chúc tốt đẹp nhất luôn được trân trọng.",
      targetSelector: TOUR_TARGET_MATRIX.submitWish,
      condition: "submission-open",
      mascotAction: "celebrate",
      speech: "Hãy gửi một lời chúc thật ý nghĩa nha!"
    },
    {
      id: "gallery",
      title: "Bức tường lời chúc",
      content: "Tất cả lời chúc từ mọi người sẽ xuất hiện tại đây theo thời gian thực.",
      targetSelector: TOUR_TARGET_MATRIX.gallery,
      condition: "always",
      mascotAction: "wave",
      speech: "Cùng xem mọi người nói gì nào!"
    }
  ]
}
