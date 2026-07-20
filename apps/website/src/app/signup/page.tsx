import { signupAction } from "./actions";


export default function SignupPage() {

  return (

    <form action={signupAction}>

      <input
        name="fullName"
        placeholder="Full Name"
      />


      <input
        name="agencyName"
        placeholder="Agency Name"
      />


      <input
        name="crNumber"
        placeholder="CR Number"
      />


      <input
        name="email"
        type="email"
        placeholder="Email"
      />


      <input
        name="password"
        type="password"
        placeholder="Password"
      />


      <button type="submit">
        Create Agency
      </button>


    </form>

  );
}