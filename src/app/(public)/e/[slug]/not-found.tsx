import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-muted/20">
      <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-6">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Không tìm thấy sự kiện</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sự kiện này không tồn tại, có thể đã bị xóa, thiết lập ở chế độ riêng tư, hoặc bạn đã nhập sai đường dẫn.
      </p>
      <Link href="/">
        <Button>Quay về trang chủ</Button>
      </Link>
    </div>
  )
}
