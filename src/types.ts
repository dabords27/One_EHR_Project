
export enum UserRole {
  ADMIN = 'ADMIN',
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR'
}

export enum UserGroup {
  Admin = 'Admin',
  User = 'User'
}

export enum UserType {
  NURSE = 'Nurse',
  DOCTOR = 'Doctor',
  MIDWIFE = 'Midwife',
  ADMIN = 'Admin',
  OTHERS = 'Others'
}

export enum UserStatus {
  ACTIVE = 'Active',
  ON_HOLD = 'On-Hold',
  DEACTIVATED = 'Deactivated'
}

export enum FormStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export enum NoteStatus {
  DRAFT = 'Draft',
  FINALIZED = 'Finalized'
}

export enum FormType {
  OPERATIVE_TECHNIQUE = 'OPERATIVE_TECHNIQUE',
  PATIENT_ASSESSMENT = 'PATIENT_ASSESSMENT',
  RECORD_OF_DELIVERY = 'RECORD_OF_DELIVERY'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  targetId: string;
  module: string;
}

export interface FormTemplate {
  id: string;
  code: string;
  name: string;
  baseModule: FormType;
  departmentTags: string[];
  status: FormStatus;
  description?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export interface Department {
  code: string;
  description: string;
}

export interface DepartmentEntry {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
}

export interface User {
  id: string;
  username: string;
  role: UserRole; 
  fullName: string;

  departments: Department[];       // accessible departments
  department?: Department;         // active department
  defaultDepartment?: Department;  // default department

  password?: string;
  
  lastName?: string;
  firstName?: string;
  middleName?: string;
  extension?: string;
  customName?: string;
  eSignature?: string; 
  email?: string;
  userGroup?: UserGroup;
  userType?: UserType;
  status?: UserStatus;
  profileImage?: string;
  doctorName?: string;
}

export interface Patient {
  case_id: string;
  mrn: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  extension?: string;
  birthdate: string;
  sex: 'Male' | 'Female';
  patient_type: 'Inpatient' | 'Outpatient' | 'Emergency';
  room_no?: string;
  bed_no?: string;
  date_admitted: string;
  status: 'Active' | 'Discharged';
}

export interface ProgressNote {
  id: string;
  patientMrn: string;
  patientName: string;
  admissionDate: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  status: NoteStatus;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface OBHistoryRow {
  id: string;
  outcome: string;
  date: string;
  aog: string;
  sex: string;
  bw: string;
  status: string;
  place: string;
  complications: string;
}

export interface OperativeRecord {
  id?: number;
  form_template_id?: string; 
  form_type: FormType;
  last_name: string;
  first_name: string;
  middle_name: string;
  extension?: string;
  birthdate: string;
  age: number;
  sex: 'Male' | 'Female';
  mrn: string;
  date_of_operation: string;
  room_no?: string;
  case_id?: string;
  physician_name?: string;
  
  // Patient Metadata for repository indexing
  patient_type?: 'Inpatient' | 'Outpatient' | 'Emergency';
  date_admitted?: string;
  patient_status?: 'Active' | 'Discharged';

  history_from?: string;
  history_from_others?: string;
  reliability?: string;
  chief_complaint?: string;
  hpi?: string;
  history_present_illness?: string;
  allergies?: string[];
  past_medical?: string[];
  family_history?: string[];

  immunization?: string[];
  personal_social?: { education: string; occupation: string; smoking: string; drinking: string; drug_use: string; };
  current_meds?: string;
  blood_type?: string;
  rh_factor?: string;
  blood_transfusion?: boolean;
  ob_gyn_history?: { lmp: string; pmp: string; menarche: string; interval: string; duration: string; amount: string; dysmenorrhea: string; first_coitus: string; first_pregnancy: string; partners: string; g: string; p: string; t: string; a: string; l: string; aog: string; edd: string; pre_weight: string; };
  ob_history_grid?: OBHistoryRow[];
  ros?: Record<string, string[]>;

  vital_signs?: { bp: string; rr: string; hr: string; temp: string; spo2: string; };
  pe_general?: { consciousness: string; coherence: string; distress: boolean; };
  pe_details?: Record<string, any>;
  admitting_diagnosis?: string;

  delivery_details?: { onset: string; oxytocin: string; ruptures: string; duration: string; stage1: string; stage2: string; stage3: string; manner: string; indication: string; anesthesia: string; episiotomy: string; complications: string; };
  baby_details?: { sex: string; as: string; bw: string; mt: string; growth: string; birth_length: string; circ_head: string; circ_chest: string; circ_abdominal: string; morbidity: string; mortality: string; };

  pre_operative_diagnosis?: string;
  post_operative_diagnosis?: string;
  technique?: string;
  operative_findings?: string;
  attending_surgeon_name?: string;
  anesthesiologist_name?: string;

  record_datetime?: string;
}
