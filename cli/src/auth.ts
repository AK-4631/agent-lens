import type { RequestHandler } from "express";

export function agentLensAuth(): RequestHandler {

  const configured =
    process.env.AGENT_LENS_API_KEY?.trim();

  return (req, res, next) => {

    /*
     * No key configured:
     * local development mode.
     */
    if (!configured) {
      next();
      return;
    }

    /*
     * Health remains available for monitoring.
     */
    if (
      req.method === "GET" &&
      req.path === "/health"
    ) {
      next();
      return;
    }

    const supplied =
      req.header("x-agent-lens-key");

    if (
      !supplied ||
      supplied !== configured
    ) {
      res.status(401).json({
        error: "Unauthorized",
        message:
          "Valid x-agent-lens-key header required."
      });

      return;
    }

    next();
  };
}
