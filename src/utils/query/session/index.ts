import { SessionManageData, SessionFetchData } from "../../../interfaces/session";
import { Sessions, User } from "../../../models";

async function fetchSession(sessionData: SessionFetchData): Promise<SessionManageData> {
    try {
        const dbSession = await Sessions.findOne({ id: sessionData.session_id }).lean();

        const userData = await User.findOne({ id: sessionData.user_id }).lean();
        if (!dbSession || !userData) throw new Error("SESSIONNOTFOUND");

        const dbDataBuild: SessionManageData = {
            session_id: sessionData.session_id,
            user_id: sessionData.user_id,
            token: dbSession?.token,
            status: userData.status,
            is_valid: dbSession.status,
        };

        return Promise.resolve(dbDataBuild);
    } catch (err) {
        return Promise.reject(err);
    }
}

export { fetchSession };
