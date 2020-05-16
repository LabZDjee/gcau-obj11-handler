/* jshint esversion: 9 */

const anixDef = {
  Profile: "0",
  Gain1: "4096",
  Gain2: "4096",
  Gain3: "4096",
  Gain4: "4096",
  IIRTakeIn1: "1",
  IIRTakeIn2: "1",
  IIRTakeIn3: "1",
  IIRTakeIn4: "1",
  Pol1: "1",
  Pol2: "1",
  Pol3: "1",
  Pol4: "1",
};

const commun2Def = {
  AltAsciiModbusParity: "0",
};

const eqDef = {
  RpnExpression: "1",
  Label: "",
  Unit: "",
  ModbusMultiplier: "1",
};

const eqctrlDef = {
  OnDiox1: "0",
  OnDiox2: "0",
  OnLoadCurrent: "0",
  OnAmbientTemperature: "0",
  OnBatteryTemperature: "0",
  OnSC5: "0",
  OnSC6: "0",
};

const evtDef = {
  Function: "OF",
  LCDLatch: "0",
  RelayLatch: "0",
  Shutdown: "0",
  CommonAlarm: "0",
  RelayNumber: "0",
  NumberOfRelays: "1",
  LedNumber: "0",
  Delay: "5",
  Value: "0",
};

const systexDef = {
  RelayRevPol: "0000000000000000",
  ParallelControl: "00",
  IrigB: "0",
  Diox1InputPeriod: "N",
  Diox2InputPeriod: "N",
  DioxPwm: "00",
  DioxMaxPeriod1: "0",
  DioxMaxPeriod2: "0",
  DioxMaxPeriod3: "0",
  HumiditySensor: "0",
  BatteryPosDeadZone: "7",
  BatteryNegDeadZone: "7",
};

const sysvarDef = {
  EventEnableMsb: "00",
};

export default {
  ANIX_1: {
    ...anixDef,
  },

  ANIX_2: {
    ...anixDef,
  },

  ANIX_3: {
    ...anixDef,
  },

  ANIX_4: {
    ...anixDef,
  },
  COMMUN2: {
    ...commun2Def,
  },
  EQ_17: {
    ...eqDef,
  },
  EQ_18: {
    ...eqDef,
  },
  EQ_19: {
    ...eqDef,
  },
  EQ_20: {
    ...eqDef,
  },
  EQ_21: {
    ...eqDef,
  },
  EQ_22: {
    ...eqDef,
  },
  EQ_23: {
    ...eqDef,
  },
  EQ_24: {
    ...eqDef,
  },
  EVT_49: {
    ...evtDef,
    Text: "EQUATION 17",
    LocalText: "EQUATION 17",
  },
  EQCTRL: {
    ...eqctrlDef,
  },
  EVT_50: {
    ...evtDef,
    Text: "EQUATION 18",
    LocalText: "EQUATION 18",
  },
  EVT_51: {
    ...evtDef,
    Text: "EQUATION 19",
    LocalText: "EQUATION 19",
  },
  EVT_52: {
    ...evtDef,
    Text: "EQUATION 20",
    LocalText: "EQUATION 20",
  },
  EVT_53: {
    ...evtDef,
    Text: "EQUATION 21",
    LocalText: "EQUATION 21",
  },
  EVT_54: {
    ...evtDef,
    Text: "EQUATION 22",
    LocalText: "EQUATION 22",
  },
  EVT_55: {
    ...evtDef,
    Text: "EQUATION 23",
    LocalText: "EQUATION 23",
  },
  EVT_56: {
    ...evtDef,
    Text: "EQUATION 24",
    LocalText: "EQUATION 24",
  },
  SYSTEX: {
    ...systexDef,
  },
  SYSVAR: {
    ...sysvarDef,
  },
};
