export type GeoPoint = {
  latitude: number
  longitude: number
}

export type LatLngBounds = {
  north: number
  south: number
  east: number
  west: number
}

export type MapViewState = {
  center: GeoPoint
  zoom: number
  bounds: LatLngBounds
}
