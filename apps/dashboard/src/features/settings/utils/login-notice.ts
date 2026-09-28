// The notice /login shows when arriving from the website's signup flow:
//   ?registered=1 - signup finished with a session (confirmation OFF)
//   ?confirmed=1  - came back from the confirmation email link
// Any other value (or none) shows nothing.
export function getLoginNotice(params: { registered?: string; confirmed?: string }): string | null {
  if (params.confirmed === "1") {
    return "Email confirmed — sign in to finish setting up your agency.";
  }
  if (params.registered === "1") {
    return "Account created — sign in to continue.";
  }
  return null;
}
