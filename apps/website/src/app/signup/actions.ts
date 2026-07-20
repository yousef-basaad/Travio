"use server";

import { signUpAgency } from "@travio/auth";


export async function signupAction(
  formData: FormData
) {

  await signUpAgency({

    fullName:
      formData.get("fullName") as string,

    agencyName:
      formData.get("agencyName") as string,

    crNumber:
      formData.get("crNumber") as string,

    email:
      formData.get("email") as string,

    password:
      formData.get("password") as string,

  });

}