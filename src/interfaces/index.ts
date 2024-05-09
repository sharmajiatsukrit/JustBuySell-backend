export interface DeviceDetails {
    device_type: string;
    device_os: string;
    device_os_version: string;
    device_vendor: string;
    device_engine: string;
    device_version: string;
    device_browser: string;
    device_browser_version: string;
    device_app_version: string;
}

export interface IpInfoData {
    query: string;
    status: string;
    continent: string;
    continentCode: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    district: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    offset: number;
    currency: string;
    isp: string;
    org: string;
    as: string;
    asname: string;
    mobile: boolean;
    proxy: boolean;
    hosting: boolean;
}

export interface JsonToken {
    email: string;
    user_id: number;
    session_id: number;
}

export interface BillingAdressType {
    city: string;
    country: string;
    line1: string;
    line2: string;
    postal_code: string;
    state: string;
}
