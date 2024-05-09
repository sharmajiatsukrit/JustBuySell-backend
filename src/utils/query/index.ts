import { getDetailsFromIp } from "..";
import { Sessions, Configs } from "../../models";

function updateSeesionWithIpInfo(sessionId: string, ip: string): void {
    getDetailsFromIp(ip).then(async (ipinfo) => {
        const { city, regionName, countryCode, lon, lat } = ipinfo;

        Sessions.findByIdAndUpdate(sessionId,
            {
                ip_info: ipinfo,
                city,
                region: regionName,
                country: countryCode,
                latitude: lat,
                longitude: lon,
            });
    });
}

async function generateInviteCode(): Promise<string> {
    const configData: any = await Configs.findOne({ key: "invite_code_count" }).lean();

    if (configData) {
        const inviteCode = configData.data || "";
        const inviteCodeNum = parseInt(inviteCode) + 1;
        const newInviteCode = "ARI" + inviteCodeNum;
        await Configs.findOneAndUpdate({ key: "invite_code_count" }, { data: inviteCodeNum.toString() });
        return Promise.resolve(newInviteCode);
    } else {
        return Promise.reject("Config data null");
    }
}

async function generateCollabCode(): Promise<string> {
    const configData: any = await Configs.findOne({ key: "collab_code_count" }).lean();

    if (configData) {
        const inviteCode = configData.data || "";
        const inviteCodeNum = parseInt(inviteCode) + 1;
        const newInviteCode = "ARC" + inviteCodeNum;
        await Configs.findOneAndUpdate({ key: "collab_code_count" }, { data: inviteCodeNum.toString() });
        return Promise.resolve(newInviteCode);
    } else {
        return Promise.reject("Config data null");
    }
}

export { updateSeesionWithIpInfo, generateInviteCode, generateCollabCode };
