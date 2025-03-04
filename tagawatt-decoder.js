const PAYLOAD_TYPE = {
  T1              :  {header: 0x75, size_min: 3/*in bytes*/, size_max: 51/*in bytes*/, name: "T1"},
  START           :  {header: 0x01, size: 3/*in bytes*/,  name: "START"}
}

//Main function Decoder
function decodeUplink(input){
  var decoded = {
    data: {
      time_shifting : null,
      message_type : null,
      tags: null,
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
  //Decode message
  if(decoded.data.message_type == PAYLOAD_TYPE.T1.name){
    var data = decode_T1(input.bytes, input.recvTime);
    decoded.data.time_shifting = data.time_shifting;
    decoded.data.tags = data.tags;
  }
  return decoded
}

//Find message type - return null if nothing found
function find_message_type(payload){
  switch(payload[0]){
    case PAYLOAD_TYPE.T1.header:
      if(payload.length >= PAYLOAD_TYPE.T1.size_min && payload.length <= PAYLOAD_TYPE.T1.size_max) return PAYLOAD_TYPE.T1.name
      break;
    case PAYLOAD_TYPE.START.header:
      if(payload.length == PAYLOAD_TYPE.START.size) return PAYLOAD_TYPE.START.name
      break;
  }
  return null
}

function decode_T1(payload, recvTime){
  var data = {};
  data.time_shifting = payload[1];
  data.byte_values  = payload[2]
  data.tags = []
  var tag_count = (payload.length-3)/8;
  var tag_idx = 0;
  for(var i=0;i<tag_count*8;i+=8){
    var id_tag = (payload[3+i] & 0xFF) << 24 | (payload[3+i+1] & 0xFF) << 16 | (payload[3+i+2] & 0xFF) << 8 | (payload[3+i+3] & 0xFF);
    var val = (payload[3+i+4] & 0xFF) << 24 | (payload[3+i+5] & 0xFF) << 16 | (payload[3+i+6] & 0xFF) << 8 | (payload[3+i+7] & 0xFF);
    var isPower = (data.byte_values >> tag_idx) & 1;
    tag_idx++;
    if(isPower){
      if((val >>> 0) == 0x80000000 || (val >>> 0) == 0x80000001 ||(val >>> 0) == 0x80000002
         ||(val >>> 0) == 0x80000003 ||(val >>> 0) == 0x80000004 ||(val >>> 0) == 0x80000005) val = null
    }else{
      if((val >>> 0) == 0xFFFFFFFF || (val >>> 0) == 0xFFFFFFFE ||(val >>> 0) == 0xFFFFFFFD
         ||(val >>> 0) == 0xFFFFFFFC ||(val >>> 0) == 0xFFFFFFFB ||(val >>> 0) == 0xFFFFFFFA) val = null;
      else val = toUnsignedInt32(val)/100;
    }
    if(recvTime != null){
      var d = new Date(recvTime)
      d.setSeconds(d.getSeconds() - ((nb_values_in_payload-i)*data.time_step*60));
      if(isPower){
        data.tags.push({
          id_tag: id_tag,
          id_tag_str: ('00000000'+id_tag.toString(16)).substr(-8),
          power_index: val,
          date : d.toISOString()
        });
      }else{
        data.tags.push({
          id_tag: id_tag,
          id_tag_str: ('00000000'+id_tag.toString(16)).substr(-8),
          current_index: val,
          date: d.toISOString()
        });
      }
    }else{
      if(isPower){
        data.tags.push({
          id_tag: id_tag,
          id_tag_str: ('00000000'+id_tag.toString(16)).substr(-8),
          power_index: val
        });
      }else{
        data.tags.push({
          id_tag: id_tag,
          id_tag_str: ('00000000'+id_tag.toString(16)).substr(-8),
          current_index: val
        });
      }
     }
  }
  return data
}

function toUnsignedInt32(val){
  return val >>> 0;
}
