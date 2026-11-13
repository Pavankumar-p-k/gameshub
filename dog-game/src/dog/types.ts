// Local stand-ins for the nintendogs world types the dog actors need
// (bounds to keep the dog inside the map, circles to steer around obstacles).

export interface Circle { x: number; z: number; r: number }
export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }
