import * as React from "react"

import { Button } from "@/components/ui/button"

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "aria-label"
> & {
  label: string
  children: React.ReactNode
}

export function IconButton({
  label,
  title,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={title ?? label}
      size={props.size ?? "icon"}
    >
      {children}
    </Button>
  )
}