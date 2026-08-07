import type { GuidedTourConfig } from "./types"

export const dashboardTourConfig: GuidedTourConfig = {
  tourId: "dashboard-event-create",
  version: "v1",
  mascotId: "anime-party",
  steps: [
    {
      id: "title",
      title: "Tên sự kiện",
      content: "Bắt đầu bằng việc đặt một cái tên thật hay cho sự kiện của bạn nhé!",
      targetSelector: "[data-tour-target='event-title']",
      condition: "always",
      mascotAction: "point-to-content",
      speech: "Đặt tên sự kiện ở đây nha!",
      placement: "right",
      allowInteraction: true,
    },
    {
      id: "slug",
      title: "Đường dẫn (slug)",
      content: "Đây là đường dẫn duy nhất để khách mời truy cập vào trang sự kiện của bạn. Hãy chọn một đường dẫn dễ nhớ!",
      targetSelector: "[data-tour-target='event-slug']",
      condition: "always",
      mascotAction: "point-to-content",
      speech: "Link sự kiện sẽ trông như thế này nè!",
      placement: "right",
      allowInteraction: true,
    },
    {
      id: "visibility",
      title: "Chế độ hiển thị",
      content: "Bạn có thể quyết định ai được phép xem trang sự kiện này. Riêng tư, cần link hoặc công khai hoàn toàn.",
      targetSelector: "[data-tour-target='event-visibility']",
      condition: "always",
      mascotAction: "point-to-content",
      speech: "Sự kiện này dành cho ai nhỉ?",
      placement: "right",
      allowInteraction: true,
    },
    {
      id: "preview",
      title: "Xem trước trực tiếp",
      content: "Bất cứ thay đổi nào của bạn sẽ được cập nhật ngay tại đây để bạn dễ hình dung sự kiện thực tế.",
      targetSelector: "[data-tour-target='event-preview']",
      condition: "always",
      mascotAction: "wave",
      speech: "Mọi thay đổi sẽ hiện ra ở đây!",
      placement: "left",
      allowInteraction: false,
    },
    {
      id: "submit",
      title: "Lưu sự kiện",
      content: "Sau khi đã ưng ý, hãy nhấn nút này để chính thức tạo không gian cho sự kiện của bạn!",
      targetSelector: "[data-tour-target='event-submit']",
      condition: "always",
      mascotAction: "celebrate",
      speech: "Xong rồi thì bấm lưu nhé!",
      placement: "top",
      allowInteraction: false,
    }
  ]
}
