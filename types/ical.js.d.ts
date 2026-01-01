declare module 'ical.js' {
  export class Component {
    constructor(jcalData: any);
    getAllSubcomponents(name: string): any[];
  }

  export class Event {
    constructor(vevent: any);
    summary: string;
    description: string;
    location: string;
    startDate: Time;
    endDate: Time;
  }

  export class Time {
    toJSDate(): Date;
  }

  export function parse(icalData: string): any;
}
