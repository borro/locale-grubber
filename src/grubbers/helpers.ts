import {GrubberInterface, GrubberOptionsInterface} from "./grubber";
import {Grubber as RegexpGrubber, GrubberOptions as RegexpGrubberOptions} from "./regexp";


export function createGrubberByName(name: string, options: GrubberOptionsInterface): GrubberInterface {
    switch (name) {
        case 'regexp':
            return new RegexpGrubber(options as RegexpGrubberOptions);
    }
    throw new Error(`Can not have grubber ${name}`);
}
