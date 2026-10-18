/**
 * Every word of the 2W form lives here: the guidelines tables, the questions,
 * the detail fields and the exact labels written to the Google Sheet and the hub.
 * The guidelines pages, the form, the review, the PDF and the Sheet row are all
 * generated from this file.
 *
 * IMPORTANT: `sheetLabel` is the column heading in the Google Sheet and the hub.
 * Changing one starts a new column, so keep them exactly as they are unless the
 * Sheet is being changed on purpose. `text` (what the line manager reads on the
 * form) and `tableText` (the guidelines table) are free to change.
 *
 * Question `id`s are stable keys for answers in the browser; they are never sent.
 */

export type YesNo = "Yes" | "No";

export type Question = {
  id: string;
  /** Shown on the form, under its number. */
  text: string;
  /** Shown in the guidelines table (defaults to `text`). */
  tableText?: string;
  /** The Sheet / hub column heading. Do not change casually. */
  sheetLabel: string;
  /** "Assessment Guidelines for Line Manager" column, and the "How to check" text under the question. */
  guideline: string;
  /** The answer that means "all good". Anything else is flagged. Defaults to "Yes". */
  expected?: YesNo;
};

export type AssessmentSection = {
  id: "vehicle" | "rider";
  /** Heading above the questions and in the review. */
  title: string;
  /** Heading on the guidelines page. */
  guidelinesHeading: string;
  /** Header of the guidelines table's second column. */
  tableTitle: string;
  /** Step pill label. */
  stepLabel: string;
  /** Label of the guidelines page's button to the next page. */
  guidelinesNext: string;
  questions: Question[];
};

type FieldBase = {
  id: string;
  label: string;
  /** The Sheet / hub column heading. Do not change casually. */
  sheetLabel: string;
  required?: boolean;
  /** Only show (and only validate / send) when another field has this value. */
  showIf?: { field: string; equals: string };
};

export type FieldDef =
  | (FieldBase & { kind: "text"; placeholder?: string; maxLength?: number })
  | (FieldBase & { kind: "select"; options: string[] | { dependsOn: string; map: Record<string, string[]> } })
  | (FieldBase & { kind: "radio"; options: string[] });

export const FORM_META = {
  title: "Two Wheeler Ride Along Form",
  shortTitle: "2W Ride Along",
  posterTitle: ["Two Wheeler", "Ride Along Assessment"],
  description: "Two Wheeler Ride Along Assessment",
  confirmation: "I confirm that I have personally checked and verified the assessment details of the vehicle and the rider.",
  remarkMaxLength: 175,
  /**
   * Every question starts unanswered, so the line manager has to make an explicit Yes/No
   * choice on each one (client request: a pre-filled "Yes" could be left without really checking).
   */
  prefillExpectedAnswers: false,
};

/** Asked at the top of the first step. */
export const PARTICIPANT_FIELDS: FieldDef[] = [
  { kind: "text", id: "hq", label: "HQ", sheetLabel: "HQ", required: true, maxLength: 80 },
  { kind: "text", id: "name", label: "Name", sheetLabel: "Name", required: true, maxLength: 80 },
  { kind: "text", id: "team", label: "Team", sheetLabel: "Team", required: true, maxLength: 80 },
  { kind: "text", id: "lineMan", label: "Line Manager", sheetLabel: "Line Man", required: true, maxLength: 80 },
];

export const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    id: "vehicle",
    title: "Vehicle Assessment",
    guidelinesHeading: "Vehicle Assessment Guidelines",
    tableTitle: "Vehicle Assessment",
    stepLabel: "Vehicle Assessment",
    guidelinesNext: "Next",
    questions: [
      {
        id: "tyre-pressure",
        text: "Is the Vehicle Tyre Pressure correct? Instruct the employee to check tyre pressure at a fuel station and ensure the air is filled according to the manufacturer’s instructions.",
        tableText: "Is the Vehicle Tyre Pressure correct? ",
        sheetLabel: "Is the Vehicle Tyre Pressure correct?",
        guideline:
          "Instruct the employee to check tyre pressure at a fuel station and ensure the air is filled according to the manufacturer’s instructions.",
      },
      {
        id: "tyre-tread",
        text: "How is the treading condition of the tyres? Are there any cuts?",
        sheetLabel: "How is the treading condition of the tyres?",
        guideline:
          "Check the tyre thoroughly by inspecting the tread depth. Spin the wheel slowly and check for cuts, splits, bulges, or worn fabric.",
      },
      {
        id: "speedometer",
        text: "Is the speedometer functioning properly?",
        sheetLabel: "Is the speedometer functioning properly?",
        guideline:
          "Test ride the vehicle from Point A to Point B and check if the speedometer is functioning. The distance covered should reflect in the meter reading & the speedo needle should indicate the speed of the vehicle.",
      },
      {
        id: "fuel-meter",
        text: "Is the fuel meter functioning properly?",
        sheetLabel: "Is the fuel meter functioning properly?",
        guideline:
          "Turn the ignition on and observe the needle on the fuel gauge, check if it moves. The reading of the fuel meter should match the fuel present in the vehicle.",
      },
      {
        id: "mirrors",
        text: "Are both mirrors present? Is it positioned properly as per rider's eye line?",
        sheetLabel: "Are both mirrors present? Is it positioned properly as per rider's eye line?",
        guideline:
          "Check physically if both the mirrors are present. The mirrors should be accurately aligned to the eye line of the rider while sitting in riding position.",
      },
      {
        id: "brakes",
        text: "Do the front and rear brakes function properly?",
        tableText: "Do the front & rear brakes function properly?",
        sheetLabel: "Do the front and rear brakes function properly?",
        guideline: "Test ride the vehicle and check if the brakes are effective when applied. Brake levers should not be too soft when applied.",
      },
      {
        id: "horn",
        text: "Is the horn functioning properly?",
        sheetLabel: "Is the horn functioning properly?",
        guideline:
          "Gently press the horn button and check if the horn is functioning properly. The sound output should be clear and audible. Highlight if the horn is extremely loud or musical.",
      },
      {
        id: "starter",
        text: "Is the auto/kick starter functioning properly?",
        tableText: "Is the auto/ kick starter functioning properly?",
        sheetLabel: "Is the auto/kick starter functioning properly?",
        guideline:
          "Gently press the auto start button and check if the engine switches on in a smooth manner. Use the kicker lever if the auto starter is not present.",
      },
      {
        id: "key",
        text: "Is the vehicle key in good condition? Check for any bend or rust.",
        tableText: "Is the vehicle key in good condition? Check for any bend or rust",
        sheetLabel: "Is the vehicle key in good condition? Check for any bend or rust",
        guideline: "Physically check the teeth condition of the key, highlight if it's worn out. Check for any bend or rust in the key.",
      },
      {
        id: "seat",
        text: "How is the seat condition of the vehicle? Is there any damage/cuts?",
        sheetLabel: "How is the seat condition of the vehicle? Is there any damage/cuts?",
        guideline:
          "Check the seat condition by gently pressing the seat, highlight if the seat is hard or worn out. Seat assembly should be soft and comfortable to avoid back aches of a rider. Check for any cuts or damages.",
      },
      {
        id: "stands",
        text: "Is the main stand & side stand functioning properly?",
        sheetLabel: "Is the main stand & side stand functioning properly?",
        guideline: "Use the main & side stands, operation should be smooth and easy. Check for any bend or rust in the stands.",
      },
      {
        id: "number-plates",
        text: "Are the number plates of the vehicle clearly visible?",
        sheetLabel: "Are the number plates of the vehicle clearly visible?",
        guideline:
          "All the characters in the number plates should be clear and visible. It is illegal to use illegible or stylish fonts. Govt has recommended to use IND(embossed)number plates.",
      },
    ],
  },
  {
    id: "rider",
    title: "Rider Assessment",
    guidelinesHeading: "Rider Assessment Guidelines",
    tableTitle: "Rider Assessment",
    stepLabel: "Rider Safety",
    guidelinesNext: "Start Form",
    questions: [
      {
        id: "hand-signal",
        text: "Does the rider use hand signal/indicator while taking a turn?",
        tableText: "Does the rider use hand signal / indicator while taking a turn?",
        sheetLabel: "Does the rider use hand signal/indicator while taking a turn?",
        guideline:
          "Check if rider uses hand signals while taking turns on the roads. For safety purposes, it is recommended to use both hand signal and vehicle indicator.",
      },
      {
        id: "overtaking",
        text: "Does the rider overtake from the correct side?",
        sheetLabel: "Does the rider overtake from the correct side?",
        guideline: "Indian traffic rules require the rider to ride on the left-side of the road. This means that over-taking is permitted only on the right.",
      },
      {
        id: "shoes",
        text: "Does the rider wear shoes with a well-defined heel while riding?",
        tableText: "Does the rider wear shoes with well-defined heel while riding?",
        sheetLabel: "Does the rider wear shoes with a well-defined heel while riding?",
        guideline: "Check if the rider uses a good protective shoe with a thick sole. Sport shoes are not recommended for safety purposes.",
      },
      {
        id: "sleepy",
        text: "Is the rider sleepy while riding?",
        sheetLabel: "Is the rider sleepy while riding?",
        guideline:
          "Yawning and dropping eyelids while riding are signs of a tired/sleepy rider. Unstable steering pattern movements indicate drowsiness.",
        expected: "No",
      },
      {
        id: "traffic-signals",
        text: "Does the rider stop at traffic signals?",
        sheetLabel: "Does the rider stop at traffic signals?",
        guideline: "Rider should stop at a red light and slow down at a yellow light. Signal jumping violations can be checked on traffic police website.",
      },
      {
        id: "mobile-phone",
        text: "Does the rider use a mobile phone while riding?",
        tableText: "Does the rider use mobile phone while riding?",
        sheetLabel: "Does the rider use a mobile phone while riding?",
        guideline:
          "Usage of a mobile phone is illegal while riding. Microphones/handsfree is not suggested for safety purposes as it may cause distractions while riding.",
        expected: "No",
      },
      {
        id: "speed-limits",
        text: "Does the rider follow legal speed limits?",
        sheetLabel: "Does the rider follow legal speed limits?",
        guideline: "Speed limit of a two-wheeler ranges from 40 -60 kmph within city limits. Speed limit varies with every state in India.",
      },
      {
        id: "posture",
        text: "Is the rider’s sitting posture correct? Check the position of hands, elbows, knees, and thighs.",
        tableText: "Is the rider's sitting posture correct? Check the position of hands, elbows, knees & thighs.",
        sheetLabel: "Is the rider’s sitting posture correct? Check the position of hands, elbows, knees, and thighs.",
        guideline:
          "The standard position for riding is sitting with their back upright, shoulders should be stacked above the hips and slightly pushed back. Refer to the pic attached.",
      },
      {
        id: "ambulance",
        text: "Does the rider make way for an ambulance?",
        tableText: "Does the rider make way for Ambulance?",
        sheetLabel: "Does the rider make way for an ambulance?",
        guideline:
          "A rider must slow down and check the traffic around the vehicle and move to their left giving way to the ambulance on the right side of the road.",
      },
      {
        id: "courtesy",
        text: "Is the rider courteous to other road users?",
        sheetLabel: "Is the rider courteous to other road users?",
        guideline:
          "A rider must be always alert and make way for other vehicles on roads. Rider must slow down in pedestrian crossing, school zones etc., and should not ride on pavements. Rash riding may lead to fatal accidents to the rider and other motorists on the roads.",
      },
      {
        id: "safe-rider",
        text: "Has the rider attended the Safe Rider Programme? Date:",
        tableText: "Has the Rider attended Safe Rider Programme? Date:",
        sheetLabel: "Has the rider attended the Safe Rider Programme? Date:",
        guideline: "Yes or No. Mention the date of training attended.",
      },
      {
        id: "helmet-worn",
        text: "Does the rider wear an AZ Helmet with the strap buckled?",
        tableText: "Does the rider wear AZ Helmet with strap buckled?",
        sheetLabel: "Does the rider wear an AZ Helmet with the strap buckled?",
        guideline: "Rider should use AZ Helmet with strap always buckled while riding for maximum safety.",
      },
      {
        id: "helmet-condition",
        text: "Is the helmet in good condition?",
        sheetLabel: "Is the helmet in good condition?",
        guideline: "Check for dents/damages on the outer surface, foam condition, and scratches on the visor. Reflective logo on the rear should be visible.",
      },
      {
        id: "jacket-worn",
        text: "Does the rider wear an AZ Jacket?",
        tableText: "Does the rider wear AZ Jacket?",
        sheetLabel: "Does the rider wear an AZ Jacket?",
        guideline: "Yes or No. Mention the reason.",
      },
      {
        id: "jacket-condition",
        text: "Is the jacket in good condition?",
        sheetLabel: "Is the jacket in good condition?",
        guideline: "Check for damages/cuts and verify overall condition. Observe and highlight if the reflective strips are damaged (front and rear).",
      },
    ],
  },
];

/** Final step: the vehicle on record, plus an optional secondary vehicle. */
const FUEL_BY_VEHICLE: Record<string, string[]> = {
  "2 Wheeler": ["Petrol", "EV"],
  "4 Wheeler": ["Petrol", "Diesel", "EV"],
};

const ifSecondary = { field: "useSecondaryVehicle", equals: "Yes" };

export const VEHICLE_FIELDS: FieldDef[] = [
  {
    kind: "select",
    id: "primaryVehicle",
    label: "Primary Vehicle",
    sheetLabel: "Primary Vehicle",
    required: true,
    options: ["2 Wheeler", "4 Wheeler"],
  },
  {
    kind: "select",
    id: "fuelType",
    label: "Primary Vehicle Fuel Type",
    sheetLabel: "Primary Vehicle Fuel Type",
    required: true,
    options: { dependsOn: "primaryVehicle", map: FUEL_BY_VEHICLE },
  },
  {
    kind: "text",
    id: "primaryVehicleNumber",
    label: "Vehicle Number",
    sheetLabel: "Primary Vehicle Number",
    required: true,
    maxLength: 20,
    placeholder: "e.g. KA01AB1234",
  },
  {
    kind: "text",
    id: "primaryVehicleManufacturer",
    label: "Manufacturer",
    sheetLabel: "Primary Vehicle Manufacturer",
    required: true,
    maxLength: 60,
    placeholder: "e.g. Honda",
  },
  {
    kind: "text",
    id: "primaryVehicleModel",
    label: "Model",
    sheetLabel: "Primary Vehicle Model",
    required: true,
    maxLength: 60,
    placeholder: "e.g. Activa",
  },
  {
    kind: "radio",
    id: "useSecondaryVehicle",
    label: "Do you use a Secondary Vehicle for field work?",
    sheetLabel: "Do you use a secondary vehicle for field of work?",
    required: true,
    options: ["Yes", "No"],
  },
  {
    kind: "select",
    id: "secondaryVehicle",
    label: "Secondary Vehicle",
    sheetLabel: "Secondary Vehicle",
    required: true,
    options: ["2 Wheeler", "4 Wheeler"],
    showIf: ifSecondary,
  },
  {
    kind: "select",
    id: "secondaryVehicleFuelType",
    label: "Secondary Vehicle Fuel Type",
    sheetLabel: "Secondary Vehicle Fuel Type",
    required: true,
    options: { dependsOn: "secondaryVehicle", map: FUEL_BY_VEHICLE },
    showIf: ifSecondary,
  },
  {
    kind: "text",
    id: "secondaryVehicleNumber",
    label: "Secondary Vehicle Number",
    sheetLabel: "Secondary Vehicle Number",
    required: true,
    maxLength: 20,
    showIf: ifSecondary,
  },
  {
    kind: "text",
    id: "secondaryVehicleManufacturer",
    label: "Secondary Manufacturer",
    sheetLabel: "Secondary Vehicle Manufacturer",
    required: true,
    maxLength: 60,
    showIf: ifSecondary,
  },
  {
    kind: "text",
    id: "secondaryVehicleModel",
    label: "Secondary Model",
    sheetLabel: "Secondary Vehicle Model",
    required: true,
    maxLength: 60,
    showIf: ifSecondary,
  },
];

/** Sheet headings of the questions whose "all good" answer is No (e.g. "Is the rider sleepy?"). */
export const EXPECTED_NO_LABELS: string[] = ASSESSMENT_SECTIONS.flatMap((s) => s.questions.filter((q) => q.expected === "No").map((q) => q.sheetLabel));
