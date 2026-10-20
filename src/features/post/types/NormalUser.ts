export interface NormalUser {
    id: string
    fullName: string
    avatarUrl: string
    bio: string
    dateOfBirth: string
    gender: string
    currentLocation: {
        latitude: number
        longitude: number
    }
    currentH3Index: string
    locationUpdateAt: string

}