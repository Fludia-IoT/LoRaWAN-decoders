const PAYLOAD_TYPE = {
  T1_MME_E_SUM                      :  {header: 0x2e, size: 28/*in bytes*/, name: "T1_MME_E_SUM"},
  T1_MME_E_POS                      :  {header: 0x2f, size: 28/*in bytes*/, name: "T1_MME_E_POS"},
  T1_MME_E_NEG                      :  {header: 0x30, size: 28/*in bytes*/, name: "T1_MME_E_NEG"},
  T1_MME_E_POS_AND_E_NEG            :  {header: 0x35, size: 52/*in bytes*/, name: "T1_MME_E_POS_AND_E_NEG"},
  T1_MECA_10MN                      :  {header: 0x48, size: 21/*in bytes*/, name: "T1_MECA_10MN"},
  T1_MECA_15MN                      :  {header: 0x49, size: 21/*in bytes*/, name: "T1_MECA_15MN"},
  T1_MECA_1H                        :  {header: 0x4a, size: 21/*in bytes*/, name: "T1_MECA_1H"},
  T2_MME                            :  {header: 0x2a, size: 18/*in bytes*/, name: "T2_MME"},
  T2_MECA                           :  {header: 0x4b, size: 12/*in bytes*/, name: "T2_MECA"},
  TT1_MECA                          :  {header: 0x12, size: 37/*in bytes*/, name: "TT1_MECA"},
  TT2_MECA                          :  {header: 0x13, size: 30/*in bytes*/, name: "TT2_MECA"},
  START                             :  {header: 0x01, size: 3/*in bytes*/,  name: "START"}
}

//Main function Decoder
function decodeUplink(input){
  var decoded = {
    data: {
      index : null,
      message_type : null,
      increments : [],
      powers : [],
      indexes : [],
      time_step: null,
      meter_type : null,
      firmware_version: null,
      param_id: null,
      sensitivity: null,
      scaler_e_pos: null,
      scaler_e_sum: null,
      scaler_e_neg: null,
      low_battery : null,
      number_of_starts : null,
      obis: null,
      step: null,
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
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_POS.name) decoded.data.obis = "E-POS values (OBIS code 1.8.0)";
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_SUM.name) decoded.data.obis = "E-SUM values (OBIS code 16.8.0)";
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_NEG.name) decoded.data.obis = "E-NEG values (OBIS code 2.8.0)";
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_POS_AND_E_NEG.name) decoded.data.obis = "E-POS values (OBIS code 1.8.0) and E-NEG values (OBIS code 2.8.0)";

  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_10MN.name) decoded.data.time_step = 10;
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_15MN.name) decoded.data.time_step = 15;
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_1H.name) decoded.data.time_step = 60;
  //Decode message
  if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_SUM.name || decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_POS.name
    || decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_NEG.name){
    var data = decode_T1_MME(input.bytes,decoded.data.message_type, input.recvTime);
    decoded.data.meter_type = "mME (Position B)";
    decoded.data.index = data.index;
    decoded.data.powers = data.powers;
    decoded.data.increments = data.increments;
    decoded.data.indexes = data.indexes;
    decoded.data.time_step = data.time_step;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.T1_MME_E_POS_AND_E_NEG.name){
    var data = decode_T1_MME_E_POS_AND_E_NEG(input.bytes,decoded.data.message_type, input.recvTime);
    for(var i = 0;i<data.warnings.length;i++){
      decoded.warnings.push(data.warnings[i]);
    }
    decoded.data.meter_type = "mME (Position B)";
    decoded.data.index = data.index;
    decoded.data.powers = data.powers;
    decoded.data.increments = data.increments;
    decoded.data.indexes = data.indexes;
    decoded.data.time_step = data.time_step;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.T2_MME.name){
    var data = decode_T2_MME(input.bytes);
    for(var i = 0;i<data.warnings.length;i++){
      decoded.warnings.push(data.warnings[i]);
    }
    decoded.data.index = data.index;
    decoded.data.meter_type = "mME (Position B)";
    decoded.data.firmware_version = data.firmware_version;
    decoded.data.time_step = data.time_step;
    decoded.data.obis = data.obis;
    decoded.data.scaler_e_pos = data.scaler_e_pos;
    decoded.data.scaler_e_sum = data.scaler_e_sum;
    decoded.data.scaler_e_neg = data.scaler_e_neg;
    decoded.data.sensitivity = data.sensitivity;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_10MN.name || decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_15MN.name
    || decoded.data.message_type == PAYLOAD_TYPE.T1_MECA_1H.name){
    var data = decode_T1_MECA(input.bytes, decoded.data.time_step, input.recvTime);
    decoded.data.meter_type = "Electromechanical (Position A)";
    decoded.data.index = data.index;
    decoded.data.increments = data.increments;
    decoded.data.powers = data.powers;
    decoded.data.indexes = data.indexes;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.T2_MECA.name){
    var data = decode_T2_MECA(input.bytes);
    decoded.data.index = data.index;
    decoded.data.meter_type = "Electromechanical (Position A)";
    decoded.data.low_battery = data.low_battery;
    decoded.data.firmware_version = data.firmware_version;
    decoded.data.number_of_starts = data.number_of_starts;
    decoded.data.param_id = data.param_id;
    decoded.data.time_step = data.time_step;
  }else if(decoded.data.message_type == PAYLOAD_TYPE.TT1_MECA.name || decoded.data.message_type == PAYLOAD_TYPE.TT2_MECA.name){
    decoded.data.meter_type = "Electromechanical (Position A)"
  }
  return decoded
}

//Find message type - return null if nothing found
function find_message_type(payload){
  if(payload[0] == 0xf0){
    switch(payload[1]){
      case PAYLOAD_TYPE.T1_MME_E_SUM.header:
        if(payload.length == PAYLOAD_TYPE.T1_MME_E_SUM.size) return PAYLOAD_TYPE.T1_MME_E_SUM.name
        break;
      case PAYLOAD_TYPE.T1_MME_E_POS.header:
        if(payload.length == PAYLOAD_TYPE.T1_MME_E_POS.size) return PAYLOAD_TYPE.T1_MME_E_POS.name
        break;
      case PAYLOAD_TYPE.T1_MME_E_NEG.header:
        if(payload.length == PAYLOAD_TYPE.T1_MME_E_NEG.size) return PAYLOAD_TYPE.T1_MME_E_NEG.name
        break;
      case PAYLOAD_TYPE.T1_MME_E_POS_AND_E_NEG.header:
        if(payload.length == PAYLOAD_TYPE.T1_MME_E_POS_AND_E_NEG.size) return PAYLOAD_TYPE.T1_MME_E_POS_AND_E_NEG.name
        break;
      case PAYLOAD_TYPE.T2_MME.header:
        if(payload.length == PAYLOAD_TYPE.T2_MME.size) return PAYLOAD_TYPE.T2_MME.name
        break;
    }
  }else{
    switch(payload[0]){
      case PAYLOAD_TYPE.T1_MECA_10MN.header:
        if(payload.length == PAYLOAD_TYPE.T1_MECA_10MN.size) return PAYLOAD_TYPE.T1_MECA_10MN.name
        break;
      case PAYLOAD_TYPE.T1_MECA_15MN.header:
        if(payload.length == PAYLOAD_TYPE.T1_MECA_15MN.size) return PAYLOAD_TYPE.T1_MECA_15MN.name
        break;
      case PAYLOAD_TYPE.T1_MECA_1H.header:
        if(payload.length == PAYLOAD_TYPE.T1_MECA_1H.size) return PAYLOAD_TYPE.T1_MECA_1H.name
        break;
      case PAYLOAD_TYPE.T2_MECA.header:
        if(payload.length == PAYLOAD_TYPE.T2_MECA.size) return PAYLOAD_TYPE.T2_MECA.name
        break;
      case PAYLOAD_TYPE.TT1_MECA.header:
        if(payload.length == PAYLOAD_TYPE.TT1_MECA.size) return PAYLOAD_TYPE.TT1_MECA.name
        break;
      case PAYLOAD_TYPE.TT2_MECA.header:
        if(payload.length == PAYLOAD_TYPE.TT2_MECA.size) return PAYLOAD_TYPE.TT2_MECA.name
        break;
      case PAYLOAD_TYPE.START.header:
        if(payload.length == PAYLOAD_TYPE.START.size) return PAYLOAD_TYPE.START.name
        break;
    }
  }
  return null
}

function decode_T1_MME(payload, type, recvTime){
  var data = {};
  data.time_step = payload[2];
  data.powers = [];
  data.increments = [];
  data.indexes = [];
  data.warnings = [];
  var signed = payload[3];
  if(payload[4] == 0xFF && (payload[5]) == 0xFF && (payload[6]) == 0xFF && (payload[7]) == 0xFF
      && (payload[8]) == 0xFF && (payload[9]) == 0xFF && (payload[10]) == 0xFF && (payload[11]) == 0xFF){
        data.index = null;
  }else{
    if(!signed){
      data.index = parseInt(toHexString(payload).substring(8, 24),16)/10
    }else{
      if(payload[4] & 0x80){
        //We have a negative number
        var bytes = [];
        for(var i = 0;i<8;i++) bytes.push(payload[i+4])
        data.index = toSignedInt64(bytes)/10
      }else{//Positive no issue
          data.index = parseInt(toHexString(payload).substring(8, 24),16)/10
      }
    }
  }
  for(var i = 0;i<8;i++){
    if(payload[12+i*2] == 0xFF
      && (payload[13+i*2] == 0xFF || payload[13+i*2] == 0xFE || payload[13+i*2] == 0xFD || payload[13+i*2] == 0xFC || payload[13+i*2] == 0xFB)){
        if(recvTime != null){
          var d = new Date(recvTime)
          d.setSeconds(d.getSeconds() - ((8-i)*data.time_step*60));
          data.powers.push([d.getTime(),null])
          data.increments.push([d.getTime(),null])
        }else{
          data.powers.push(null);
          data.increments.push(null);
        }
    }else{
      var value = 0;
      if(!signed) value = toUnsignedInt16(payload[12+i*2],payload[13+i*2])/10;
      else value = toSignedInt16(payload[12+i*2],payload[13+i*2])/10;
      if(recvTime != null){
        var d = new Date(recvTime)
        d.setSeconds(d.getSeconds() - ((8-i)*data.time_step*60));
        data.increments.push([d.getTime(),value])
        data.powers.push([d.getTime(),value*60/data.time_step])
      }else {
        data.increments.push(value)
        data.powers.push(value*60/data.time_step)
      }
    }
  }
  var idx = data.index
  for(var i=8;i>=0;i--){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((8-i)*data.time_step*60));
      if((i!=8 && data.increments[i][1] == null) || data.index == null) data.indexes.unshift([d.getTime(),null])
      else data.indexes.unshift([d.getTime(),idx])
      if(i!=0 && data.increments[i-1][1] != null) idx -= data.increments[i-1][1]
    }else{
      if((i!=8 && data.increments[i] == null) || data.index == null) data.indexes.unshift(null)
      else data.indexes.unshift(idx)
      if(i!=0 && data.increments[i-1] != null) idx -= data.increments[i-1]
    }
  }
  return data
}

function decode_T1_MME_E_POS_AND_E_NEG(payload, type, recvTime){
  var data = {};
  data.time_step = payload[2];
  data.powers = [[],[]];
  data.increments = [[],[]];
  data.indexes = [[],[]];
  data.warnings = [];
  data.index = {
    e_pos: null,
    e_neg: null
  }
  var nb_values_in_payload = 8
  var signedPos = false;
  var signedNeg = false;
  if(payload[3] == 1) signedPos = true;
  else if(payload[3] == 2) signedNeg = true;
  else if(payload[3] == 3){
    signedNeg = true;
    signedPos = true;
  }
  if(payload[4] == 0xFF && (payload[5]) == 0xFF && (payload[6]) == 0xFF && (payload[7]) == 0xFF
      && (payload[8]) == 0xFF && (payload[9]) == 0xFF && (payload[10]) == 0xFF && (payload[11]) == 0xFF){
        data.index.e_pos = null;
  }else{
    if(!signedPos){
      data.index.e_pos = parseInt(toHexString(payload).substring(8, 24),16)/10
    }else{
      if(payload[4] & 0x80){
        //We have a negative number
        var bytes = [];
        for(var i = 0;i<8;i++) bytes.push(payload[i+4])
        data.index.e_pos = toSignedInt64(bytes)/10
      }else{//Positive no issue
          data.index.e_pos = parseInt(toHexString(payload).substring(8, 24),16)/10
      }
    }
  }
  if(payload[4+8+2*nb_values_in_payload] == 0xFF && (payload[5+8+2*nb_values_in_payload]) == 0xFF && (payload[6+8+2*nb_values_in_payload]) == 0xFF && (payload[7+8+2*nb_values_in_payload]) == 0xFF
      && (payload[8+8+2*nb_values_in_payload]) == 0xFF && (payload[9+8+2*nb_values_in_payload]) == 0xFF && (payload[10+8+2*nb_values_in_payload]) == 0xFF && (payload[11+8+2*nb_values_in_payload]) == 0xFF){
        data.index.e_neg = null;
  }else{
    if(!signedNeg){
      data.index.e_neg = parseInt(toHexString(payload).substring(24+(4*nb_values_in_payload), 24+(4*nb_values_in_payload)+16),16)/10
      //data.index.e_neg = - data.index.e_neg
    }else{
      if(payload[4+8+2*nb_values_in_payload] & 0x80){
        //We have a negative number
        var bytes = [];
        for(var i = 0;i<8;i++) bytes.push(payload[i+(12+2*nb_values_in_payload)])
        data.index.e_neg = toSignedInt64(bytes)/10
      }else{//Positive no issue
          data.index.e_neg = parseInt(toHexString(payload).substring(24+(4*nb_values_in_payload), 24+(4*nb_values_in_payload)+16),16)/10
      }
    }
  }
  for(var i = 0;i<nb_values_in_payload;i++){
    if(payload[12+i*2] == 0xFF
      && (payload[13+i*2] == 0xFF || payload[13+i*2] == 0xFE || payload[13+i*2] == 0xFD || payload[13+i*2] == 0xFC || payload[13+i*2] == 0xFB)){
        if(recvTime != null){
          var d = new Date(recvTime)
          d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
          data.powers[0].push([d.getTime(),null])
          data.increments[0].push([d.getTime(),null])
        }else{
          data.powers[0].push(null);
          data.increments[0].push(null);
        }
    }else{
      var value = 0;
      if(!signedPos) value = toUnsignedInt16(payload[12+i*2],payload[13+i*2])/10;
      else value = toSignedInt16(payload[12+i*2],payload[13+i*2])/10;
      if(recvTime != null){
        var d = new Date(recvTime)
        d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
        data.increments[0].push([d.getTime(),value])
        data.powers[0].push([d.getTime(),value*60/data.time_step])
      }else {
        data.powers[0].push(value*60/data.time_step)
        data.increments[0].push(value)
      }
    }
  }

  for(var i = 0;i<nb_values_in_payload;i++){
    if(payload[20+nb_values_in_payload*2+i*2] == 0xFF
      && (payload[21+nb_values_in_payload*2+i*2] == 0xFF || payload[21+nb_values_in_payload*2+i*2+i*2] == 0xFE
        || payload[21+nb_values_in_payload*2+i*2] == 0xFD || payload[21+nb_values_in_payload*2+i*2] == 0xFC
        || payload[21+nb_values_in_payload*2+i*2] == 0xFB)){
        if(recvTime != null){
          var d = new Date(recvTime)
          d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
          data.powers[1].push([d.getTime(),null])
          data.increments[1].push([d.getTime(),null])
        }else{
          data.powers[1].push(null);
          data.increments[1].push(null);
        }
    }else{
      var value = 0;
      if(!signedNeg){
        value = toUnsignedInt16(payload[20+nb_values_in_payload*2+i*2],payload[21+nb_values_in_payload*2+i*2])/10;
        //value = -value;
      }
      else value = toSignedInt16(payload[20+nb_values_in_payload*2+i*2],payload[21+nb_values_in_payload*2+i*2])/10;
      if(recvTime != null){
        var d = new Date(recvTime)
        d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
        data.increments[1].push([d.getTime(),value])
        data.powers[1].push([d.getTime(),value*60/data.time_step])
      }else {
        data.powers[1].push(value*60/data.time_step)
        data.increments[1].push(value)
      }
    }
  }
  var idx_epos = data.index.e_pos
  var idx_eneg = data.index.e_neg
  for(var i=nb_values_in_payload;i>=0;i--){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
      if((i!=nb_values_in_payload && data.increments[0][i][1] == null) || data.index.e_pos == null) data.indexes[0].unshift([d.getTime(),null])
      else data.indexes[0].unshift([d.getTime(),idx_epos])
      if(i!=0 && data.increments[0][i-1][1] != null) idx_epos -= data.increments[0][i-1][1]
      if((i!=nb_values_in_payload && data.increments[1][i][1] == null) || data.index.e_neg == null) data.indexes[1].unshift([d.getTime(),null])
      else data.indexes[1].unshift([d.getTime(),idx_eneg])
      if(i!=0 && data.increments[1][i-1][1] != null) idx_eneg -= data.increments[1][i-1][1]
    }else{
      if((i!=nb_values_in_payload && data.increments[0][i] == null) || data.index.e_pos == null) data.indexes[0].unshift(null)
      else data.indexes[0].unshift(idx_epos)
      if(i!=0 && data.increments[0][i-1] != null) idx_epos -= data.increments[0][i-1]
      if((i!=nb_values_in_payload && data.increments[1][i] == null) || data.index.e_neg == null) data.indexes[1].unshift(null)
      else data.indexes[1].unshift(idx_eneg)
      if(i!=0 && data.increments[1][i-1] != null) idx_eneg -= data.increments[1][i-1]
    }
  }
  return data
}

function decode_T1_MECA(payload, time_step, recvTime){
  var data = {};
  data.index  = (payload[1] & 0xFF) << 24 | (payload[2] & 0xFF) << 16 | (payload[3] & 0xFF) << 8 | (payload[4] & 0xFF);
  data.increments = []
  data.powers = []
  data.indexes = [];
  for(var i=0;i<8;i++){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((8-i)*time_step*60));
      data.increments.push([d.getTime(),(payload[5+2*i] & 0xFF) << 8 | (payload[6+2*i] & 0xFF)])
      data.powers.push([data.increments[i][0],data.increments[i][1] * 60 / time_step])
    }else{
      data.increments.push((payload[5+2*i] & 0xFF) << 8 | (payload[6+2*i] & 0xFF))
      data.powers.push(data.increments[i] * 60 / time_step)
    }
  }
  var idx = data.index
  for(var i=8;i>=0;i--){
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((8-i)*time_step*60));
      data.indexes.unshift([d.getTime(),idx])
      if(i!=0) idx -= data.increments[i-1][1]
    }else{
      data.indexes.unshift(idx)
      if(i!=0) idx -= data.increments[i-1]
    }
  }
  return data
}

function decode_T2_MECA(payload){
  var data = {};
  data.number_of_starts = payload[1];
  data.param_id = payload[3];
  data.index = (payload[5] & 0xFF) << 24 | (payload[6] & 0xFF) << 16 | (payload[7] & 0xFF) << 8 | (payload[8] & 0xFF);
  data.firmware_version = payload[4] >> 2;
  data.low_battery = payload[4] & 0x1;
  data.meter_type = payload[4] >> 1 & 0x1;
  if(data.meter_type == 0) data.meter_type = "Electromechanical (Position A)"
  data.time_step = payload[11];
  if(data.time_step == 0) data.time_step = 10;
  if(data.time_step == 3) data.time_step = 15;
  if(data.time_step == 1) data.time_step = 60;
  return data;
}

function decode_T2_MME(payload){
  var data = {};
  data.time_step = payload[2];
  data.measure = payload[3];
  data.warnings = [];
  if(data.measure == 0) data.obis = "E-POS values (OBIS code 1.8.0)";
  if(data.measure == 1) data.obis = "E-SUM values (OBIS code 16.8.0)";
  if(data.measure == 2) data.obis = "E-NEG values (OBIS code 2.8.0)";
  if(data.measure == 3) data.obis = "E-POS values (OBIS code 1.8.0) and E-NEG values (OBIS code 2.8.0)";
  data.firmware_version = payload[5];
  data.sensitivity = payload[6];
  data.scaler_e_pos = toSignedInt8(payload[7]);
  if(payload[7] == 0x7F) data.scaler_e_pos = null;
  else data.scaler_e_pos = Math.pow(10, data.scaler_e_pos)
  data.scaler_e_sum = toSignedInt8(payload[8]);
  if(payload[8] == 0x7F) data.scaler_e_sum = null;
  else data.scaler_e_sum = Math.pow(10, data.scaler_e_sum)
  data.scaler_e_neg = toSignedInt8(payload[9]);
  if(payload[9] == 0x7F) data.scaler_e_neg = null;
  else data.scaler_e_neg = Math.pow(10, data.scaler_e_neg)
  if(data.measure == 0 || data.measure == 2 || data.measure == 3)  data.index = parseInt(toHexString(payload).substring(20, 36),16)/10;
  if(data.measure == 1){
    if(payload[10] & 0x80){
      //We have a negative number
      var bytes = [];
      for(var i = 0;i<8;i++) bytes.push(payload[i+10])
      data.index = toSignedInt64(bytes)/10
    }else{//Positive no issue
        data.index = parseInt(toHexString(payload).substring(20, 36),16)/10
    }
  }
  if(data.measure == 3){
    data.index = {
      e_pos: data.index,
      e_neg: null
    }
  }
  return data;
}

function toSignedInt8(byte1){
  if(byte1 & 0x80) return ((byte1 & 0x7F) - 0x80);
  else return (byte1 & 0x7F);
}

function toSignedInt16(byte1, byte2){
  if(byte1 & 0x80) return ((byte1 & 0x7F) - 0x80) << 8 | byte2;
  else return (byte1 & 0x7F) << 8 | byte2;
}

function toUnsignedInt16(byte1, byte2){
  return (byte1 & 0xFF) << 8 | byte2;
}

//Convert uplink payload.bytes to hexString payload
function toHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function toSignedInt64(bytes){
  var size = 8
  var first = true;
  var pos = 0
  var value = 0;
  while (size--) {
    if (first) {
      let byte = bytes[pos++];
      value += byte & 0x7f;
      if (byte & 0x80) {
        value -= 0x80;
        // Treat most-significant bit as -2^i instead of 2^i
      }
      first = false;
    }
    else {
      value *= 256;
      value += bytes[pos++];
    }
  }
  return value;
}
