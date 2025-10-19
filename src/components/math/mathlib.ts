
export type Real2D = (x: number, y: number) => number

export class Multivar2D {
    constructor(public name: string, public f: Real2D, public df_dx: Real2D, public df_dy: Real2D) {}
}