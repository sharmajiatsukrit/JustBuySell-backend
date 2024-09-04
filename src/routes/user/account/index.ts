import expres, { Router } from "express";
import AccountController from "../../../controllers/user/account";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const accountController = new AccountController();

routes.get("/get-my-profile", validateRequest, authRequest, accountController.getMyProfile.bind(accountController));
routes.put("/update-profile", validateRequest, authRequest, upload.single("company_logo"), accountController.updateMyProfile.bind(accountController));

routes.post("/wallet/recharge-wallet", validateRequest, authRequest, accountController.rechargeWallet.bind(accountController));
routes.get("/wallet/balance", validateRequest, authRequest, accountController.getWalletBalance.bind(accountController));
routes.get("/transactions", validateRequest, authRequest, accountController.getTransactions.bind(accountController));


routes.post("/report-issue", validateRequest, authRequest, accountController.ReportIssue.bind(accountController));

routes.get("/help/get-faqs", validateRequest, authRequest, accountController.getHelpFaqs.bind(accountController));
routes.get("/help/get-support-details", validateRequest, authRequest, accountController.getHelpSupportDetails.bind(accountController));

// Team
routes.get("/team-member/list", accountController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, accountController.getTeamMemberList.bind(accountController));
routes.get("/team-member/by-id/:id", accountController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, accountController.getTeamMemberById.bind(accountController));
routes.post("/team-member/add", accountController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, accountController.addTeamMember.bind(accountController));
routes.put("/team-member/update/:id", accountController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, accountController.updateTeamMember.bind(accountController));
routes.delete("/team-member/delete/:id", accountController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, accountController.deleteTeamMember.bind(accountController));



export default routes;