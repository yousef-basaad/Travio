import type { SignInState } from "@travio/auth";

// True once a submitted sign-in has finished without an error - the
// moment LoginForm should leave /login. `hasSubmitted` guards the
// initial render, where state is also { error: null } but nothing has
// been submitted yet.
export function shouldRedirectAfterSignIn(input: {
  hasSubmitted: boolean;
  pending: boolean;
  state: SignInState;
}): boolean {
  return input.hasSubmitted && !input.pending && input.state.error === null;
}
