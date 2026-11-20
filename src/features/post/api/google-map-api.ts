import { GeoPoint } from "../types/geo-point";
import { postHttp } from "./http-client";

export interface ReverseGeocodeResponse{
    placeName: string;
    formattedAddress: string;
    placeId: string;
    latitude: number;
    longitude: number;
}

export async function getPlaceFromGeoPoint(geoPoint: GeoPoint): Promise<ReverseGeocodeResponse> {
    const response = await postHttp.get<ReverseGeocodeResponse>(`/location/location/reverse-geocode`, {
        params: {
            latitude: geoPoint.latitude,
            longitude: geoPoint.longitude
        }
    });
    return response.data;
}