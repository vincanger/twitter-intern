import type { UpdateAccount } from "@wasp/actions/types";
import HttpError from "@wasp/core/HttpError.js";

export const updateAccount: UpdateAccount<{ favUsers: string[] }, void> = async ({ favUsers }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User is not authorized");
  }

  try {
    await context.entities.User.update({
      where: { id: context.user.id },
      data: { favUsers },
    });
    
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
}