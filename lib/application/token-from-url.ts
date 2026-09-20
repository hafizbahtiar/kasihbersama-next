/**
 * Membaca token daripada URL untuk aliran yang pautannya dihantar melalui e-mel
 * (sahkan e-mel, set semula kata laluan, sahkan tukar e-mel).
 *
 * Fragment (`#token=…`) didahulukan atas query dengan SENGAJA: fragment tidak pernah
 * dihantar ke pelayan dan tidak muncul dalam header Referer, jadi rahsia itu tidak
 * bocor ke log akses atau ke pihak ketiga. Query disokong sebagai jatuh balik kerana
 * sesetengah klien mel menulis semula pautan.
 */
export function readTokenFromUrl(searchParams?: Pick<URLSearchParams, "get">) {
  if (typeof window === "undefined") {
    return searchParams?.get("token") ?? ""
  }

  const hash = window.location.hash
  if (hash.startsWith("#token=")) {
    return decodeURIComponent(hash.slice("#token=".length))
  }

  if (searchParams) {
    return searchParams.get("token") ?? ""
  }

  return new URLSearchParams(window.location.search).get("token") ?? ""
}
