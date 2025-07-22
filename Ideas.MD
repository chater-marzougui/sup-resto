TODO: don't forget a teacher can eat in the students canteene


TODO: check why ctx gives error for getWeekMeals for students
export const protectedProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    const authedCtx = enforceUserIsAuthed(ctx);
    const activeCtx = enforceUserIsActive(authedCtx);
    return next({
      ctx: activeCtx,
    });
  })
);
