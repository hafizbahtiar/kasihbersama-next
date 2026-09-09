/** Title-case each word while typing a person's legal name. */
export function formatPersonNameInput(value: string) {
  return value.replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toUpperCase())
}
