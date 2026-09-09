/**
 * The height scale for form controls.
 *
 * One place, because the alternative is what this project had: `h-11` written
 * into 51 call sites. Every form wanted the 44px touch target, so every form
 * reached past the component and set the height itself - and the controls that
 * were *composed* rather than styled directly (the date picker's field and its
 * calendar button) never got the memo and stayed 32px next to a 44px text box.
 *
 * Buttons already learned this: `size="xl"` was added to their scale for the
 * same reason, with the same note. This is the same fix for the inputs.
 *
 * `default` (32px) stays for dense chrome - the sidebar search, the command
 * palette, input groups. Application forms use `xl`.
 */
export type ControlSize = "default" | "xl"

export const controlHeight: Record<ControlSize, string> = {
  default: "h-8",
  // 44px: the touch-target floor.
  xl: "h-11",
}

/** The icon-button size that lines up with a control of the given height. */
export const controlIconButtonSize: Record<ControlSize, "icon" | "icon-xl"> = {
  default: "icon",
  xl: "icon-xl",
}
