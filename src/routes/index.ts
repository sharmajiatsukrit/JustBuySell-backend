import expres, { Router } from "express";
import UserRoutes from "./user";
import AuthRoutes from "./user/auth";
import NotificationRoutes from "./notification";
import AdminRoutes from "./admin";

const routes = expres();

routes.get("/", (_req, res) => {
    res.send("JustBuySell API v1");
});
 
routes.use("/auth", AuthRoutes);
routes.use("/admin", AdminRoutes);
routes.use("/user", UserRoutes);


export default routes;
