import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  expenses: router({
    list: protectedProcedure
      .input(z.object({ month: z.date().optional() }).optional())
      .query(({ ctx, input }) => db.getUserExpenses(ctx.user.id, input?.month)),
    create: protectedProcedure
      .input(
        z.object({
          category: z.enum(["alimentacao", "lazer", "contas", "transporte", "saude", "outros"]),
          amount: z.string().or(z.number()),
          description: z.string().optional(),
          date: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createExpense({
          userId: ctx.user.id,
          category: input.category,
          amount: String(input.amount),
          description: input.description,
          date: input.date || new Date(),
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteExpense(input.id)),
  }),

  investments: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserInvestments(ctx.user.id)),
    create: protectedProcedure
      .input(
        z.object({
          ticker: z.string().min(1),
          quantity: z.string().or(z.number()),
          averagePrice: z.string().or(z.number()),
          currentPrice: z.string().or(z.number()),
          description: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createInvestment({
          userId: ctx.user.id,
          ticker: input.ticker,
          quantity: String(input.quantity),
          averagePrice: String(input.averagePrice),
          currentPrice: String(input.currentPrice),
          description: input.description,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          currentPrice: z.string().or(z.number()).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.updateInvestment(input.id, {
          currentPrice: input.currentPrice ? String(input.currentPrice) : undefined,
          description: input.description,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteInvestment(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
