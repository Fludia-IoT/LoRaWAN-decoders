const PAYLOAD_TYPE = {
  T1_10MN            :  {header: 0x20, size: 20/*in bytes*/, name: "T1_10MN"},
  T1_15MN            :  {header: 0x21, size: 20/*in bytes*/, name: "T1_15MN"},
  T1_1H              :  {header: 0x22, size: 20/*in bytes*/, name: "T1_1H"},
  T2                 :  {header: 0x0e, size: 12/*in bytes*/, name: "T2"},
  TT1_MECA           :  {header: 0x12, size: 37/*in bytes*/, name: "TT1_MECA"},
  TT2_MECA           :  {header: 0x13, size: 30/*in bytes*/, name: "TT2_MECA"},
  TT1_ELEC           :  {header: 0x12, size: 19/*in bytes*/, name: "TT1_ELEC"},
  TT2_ELEC           :  {header: 0x13, size: 11/*in bytes*/, name: "TT2_ELEC"},
  START              :  {header: 0x01, size: 3/*in bytes*/,  name: "START"}
}

//Main function Decoder
function decodeUplink(input){
  var decoded = {
    data: {
      index : null,
      message_type : null,
      increments : [],
      powers: [],
      indexes: [],
      time_step: null,
      meter_type : null,
      low_battery : null,
      firmware_version: null,
      number_of_starts : null,
      param_id: null
    },
    warnings: [],
    errors: []
  }
  //Find message type
  decoded.data.message_type = find_message_type(input.bytes);
  if(decoded.data.message_type == null){
    decoded.errors.push("Invalid payload")
    return decoded
  }
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_10MN.name) decoded.data.time_step = 10;
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_15MN.name) decoded.data.time_step = 15;
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_1H.name) decoded.data.time_step = 60;
  //Decode message
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_10MN.name || decoded.data.message_type == PAYLOAD_TYPE.T1_15MN.name
    || decoded.data.message_type == PAYLOAD_TYPE.T1_1H.name){
    var data = decode_T1(input.bytes, decoded.data.time_step, input.recvTime);
    decoded.data.index = data.index;
    decoded.data.increments = data.increments;
    decoded.data.powers = data.powers;
    decoded.data.indexes = data.indexes;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.TT1_MECA.name || decoded.data.message_type == PAYLOAD_TYPE.TT2_MECA.name){
    decoded.data.meter_type = "Electromechanical (Position A)"
  }else if(decoded.data.message_type == PAYLOAD_TYPE.TT1_ELEC.name || decoded.data.message_type == PAYLOAD_TYPE.TT2_ELEC.name){
    decoded.data.meter_type = "Electronic (Position B)"
  }else if(decoded.data.message_type == PAYLOAD_TYPE.T2.name){
    var data = decode_T2(input.bytes);
    decoded.data.index = data.index;
    decoded.data.meter_type = data.meter_type;
    decoded.data.low_battery = data.low_battery;
    decoded.data.firmware_version = data.firmware_version;
    decoded.data.number_of_starts = data.number_of_starts;
    decoded.data.param_id = data.param_id;
    decoded.data.time_step = data.time_step;
  }
  return decoded
}

//Find message type - return null if nothing found
function find_message_type(payload){
  switch(payload[0]){
    case PAYLOAD_TYPE.T1_10MN.header:
      if(payload.length == PAYLOAD_TYPE.T1_10MN.size) return PAYLOAD_TYPE.T1_10MN.name
      break;
    case PAYLOAD_TYPE.T1_15MN.header:
      if(payload.length == PAYLOAD_TYPE.T1_15MN.size) return PAYLOAD_TYPE.T1_15MN.name
      break;
    case PAYLOAD_TYPE.T1_1H.header:
      if(payload.length == PAYLOAD_TYPE.T1_1H.size) return PAYLOAD_TYPE.T1_1H.name
      break;
    case PAYLOAD_TYPE.TT1_MECA.header:
      if(payload.length == PAYLOAD_TYPE.TT1_MECA.size) return PAYLOAD_TYPE.TT1_MECA.name
      if(payload.length == PAYLOAD_TYPE.TT1_ELEC.size) return PAYLOAD_TYPE.TT1_ELEC.name
      break;
    case PAYLOAD_TYPE.TT2_MECA.header:
      if(payload.length == PAYLOAD_TYPE.TT2_MECA.size) return PAYLOAD_TYPE.TT2_MECA.name
      if(payload.length == PAYLOAD_TYPE.TT2_ELEC.size) return PAYLOAD_TYPE.TT2_ELEC.name
      break;
    case PAYLOAD_TYPE.T2.header:
      if(payload.length == PAYLOAD_TYPE.T2.size) return PAYLOAD_TYPE.T2.name
      break;
    case PAYLOAD_TYPE.START.header:
      if(payload.length == PAYLOAD_TYPE.START.size) return PAYLOAD_TYPE.START.name
      break;
  }
  return null
}

function decode_T1(payload,time_step,recvTime){
  var data = {};
  data.index  = (payload[1] & 0xFF) << 16 | (payload[2] & 0xFF) << 8 | (payload[3] & 0xFF);
  data.increments = []
  data.powers = []
  data.indexes = []
  for(var i=0;i<8;i++){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((8-i)*time_step*60));
      data.increments.push([d.toISOString(),(payload[4+2*i] & 0xFF) << 8 | (payload[5+2*i] & 0xFF)])
      data.powers.push([d.toISOString(),data.increments[i][1] * 60 / time_step])
    }else{
      data.increments.push((payload[4+2*i] & 0xFF) << 8 | (payload[5+2*i] & 0xFF))
      data.powers.push(data.increments[i] * 60 / time_step)
    }
  }
  var idx = data.index
  for(var i=8;i>=0;i--){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((8-i)*time_step*60));
      data.indexes.unshift([d.toISOString(),idx])
      if(i!=0) idx -= data.increments[i-1][1]
    }else{
      data.indexes.unshift(idx)
      if(i!=0) idx -= data.increments[i-1]
    }
  }
  return data
}

function decode_T2(payload){
  var data = {};
  data.number_of_starts = payload[1];
  data.index = (payload[5] & 0xFF) << 24 | (payload[6] & 0xFF) << 16 | (payload[7] & 0xFF) << 8 | (payload[8] & 0xFF);
  data.firmware_version = payload[4] >> 2;
  data.low_battery = payload[4] & 0x1;
  data.meter_type = payload[4] >> 1 & 0x1;
  if(data.meter_type == 0) data.meter_type = "Electromechanical (Position A)"
  if(data.meter_type == 1) data.meter_type = "Electronic (Position B)"
  data.param_id = payload[3];
  data.time_step = payload[11];
  if(data.time_step == 0) data.time_step = 10;
  if(data.time_step == 3) data.time_step = 15;
  if(data.time_step == 1) data.time_step = 60;
  return data;
}
