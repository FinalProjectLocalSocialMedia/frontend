import { GeoPoint } from "./geo-point"

export interface Location {
  id: string
  name: string
  description: string
  h3Index: string
  locationType: string
  coordinates: GeoPoint
}
