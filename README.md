# Fludia LoRaWAN decoders

These decoders are following the [LoRa Alliance Payload Codec API Specification ts013-1.0.0](https://resources.lora-alliance.org/home/ts013-1-0-0-payload-codec-api)

## Products and corresponding files

- **fm432e_ap-decoder.js** for FM432e v60
- **fm432e_nc_1mn-decoder.js** for FM432e v54
- **fm432e_nc_10mn-15mn-decoder.js** for FM432e v57
- **fm432g_ap-decoder.js** for FM432g v33
- **fm432g_nc_10mn-15mn-decoder.js** for FM432g v32
- **fm432ir_ap-decoder.js** for FM432ir v21 & v22
- **fm432ir_nc_1mn-decoder.js** for FM432ir v18
- **fm432ir_nc_15mn-decoder.js** for FM432ir v20
- **fm432p_ap-decoder.js** for FM432p v3.3.6
- **fm432p_nc_10mn-15mn-decoder.js** for FM432p v3.3.2
- **fm432t_nc_1mn-decoder.js** for FM432t v5.0.2 with 1 minute configuration
- **fm432t_nc_10mn-15mn-decoder.js** for FM432t v5.0.2
- **tagawatt-decoder.js** for TAGAWATT

## How to use the decoders  

In each file you will find a function `DecodeUplink()`  

Expected `input` object format:  

```javascript
    input:{
        "bytes": [105, 1, 0, 0, 255, 255, 0, 1, 0, 2, 0, 3],  // The uplink payload byte array, where each byte is represented by an integer
        "fPort": 129,                                         // The uplink message LoRaWAN fPort (always 129 in our products)
        "recvTime": "2024-08-02T20:00:00.000+00:00"           // The uplink message timestamp recorded by the LoRaWAN network server as a JavaScript Date object
    }
```

`output` may vary between products, and some variables are only available when a technical message is received. You can find the return format at the beginning of the `DecodeUplink()` function.

<details open>
<summary><strong>FM432e</strong></summary>
<br>  

Example of `output` JSON Object:

```javascript
    data: {
      index : 1256,
      message_type : "T1",
      increments : [1,2,3,4],
      powers: [1,2,3,4],
      indexes: [1,2,3,4],         
      meter_type : "Electromechanical (Position A)",
      low_battery : 0,
      firmware_version: 54,
      number_of_starts : 1,
      time_step : 1,
      param_id: 0,
      redundancy: 0,
      number_of_values: 4,
      sensitivity: 0
    },
    warnings: [],
    errors: []
  }
```

  * `index` index starting at 0 when the device starts  
  * `message_type` type of message  
  * `increments` array containing the index increments. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```. No increments available for 1min products  
  * `powers` array containing the load curve values in W. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```   
  * `indexes` array containing the indexes. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```. No indexes available for 1min products  
  * `meter_type` "Electromechanical (Position A)" or "Electronic (Position B)"  
  * `low_battery` 1 means the battery is low / 0 otherwise  
  * `firmware_version` firmware version as an integer  
  * `number_of_starts` number of starts of this sensor  
  * `time_step` number of minutes for each measurement  
  * `param_id` NA   
  * `redundancy` when activated, previous increments are repeated (only available in _ap products)  
  * `number_of_values` number of measurement values in each T1 uplink (only available in _ap products)  
  * `sensitivity` 0 = highest sensitivity / 3 = lowest sensitivity (only available in _ap products)  
</details>

<details>
<summary><strong>FM432g</strong></summary>
<br>  

Example of `output` JSON Object:

```javascript
    data: {
      index : 1256,
      message_type : "T1",
      increments : [1,2,3,4],
      indexes: [1,2,3,4],         
      meter_type : "Gas",
      firmware_version: 54,
      number_of_starts : 1,
      time_step : 1,
      param_id: 0,
      redundancy: 0,
      number_of_values: 4
    },
    warnings: [],
    errors: []
  }
```

  * `index` index starting at 0 when the device starts  
  * `message_type` type of message  
  * `increments` array containing the index increments. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```.  
  * `indexes` array containing the indexes. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```.  
  * `meter_type` "Gas"  
  * `firmware_version` firmware version as an integer  
  * `number_of_starts` number of starts of this sensor  
  * `time_step` number of minutes for each measurement  
  * `param_id` NA  
  * `redundancy` when activated, previous increments are repeated (only available in _ap products)  
  * `number_of_values` number of measurement values in each T1 uplink (only available in _ap products)  
</details>

<details>
<summary><strong>FM432p</strong></summary>
<br>  

Example of `output` JSON Object:

```javascript
    data: {
      index : 1256,
      message_type : "T1",
      increments : [1,2,3,4],
      indexes: [1,2,3,4],         
      meter_type : "Pulse",
      firmware_version: "3.3.6",
      number_of_starts : 1,
      time_step : 1,
      redundancy: 0,
      number_of_values: 4
    },
    warnings: [],
    errors: []
  }
```

  * `index` index starting at 0 when the device starts  
  * `message_type` type of message  
  * `increments` array containing the index increments. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```.  
  * `indexes` array containing the indexes. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]```.  
  * `meter_type` "Pulse"  
  * `firmware_version` firmware version as a string    
  * `number_of_starts` number of starts of this sensor  
  * `time_step` number of minutes for each measurement  
  * `redundancy` when activated, previous increments are repeated (only available in _ap products)  
  * `number_of_values` number of measurement values in each T1 uplink (only available in _ap products)
</details>

<details>
<summary><strong>FM432ir</strong></summary>
<br>

Example of `output` JSON Object:

```javascript
    data: {
      index : 1256,
      message_type : "T1",
      increments : [1,2,3,4],
      powers: [1,2,3,4],
      indexes: [1,2,3,4],         
      meter_type : "Electromechanical (Position A)",
      low_battery : 0,
      firmware_version: 54,
      number_of_starts : 1,
      time_step : 1,
      scaler_e_pos: 0.1,
      scaler_e_sum: null,
      scaler_e_neg: 0.1,
      obis: "E-POS values (OBIS code 1.8.0)",
      param_id: 0,
      redundancy: 0,
      number_of_values: 4,
      sensitivity: 0
    },
    warnings: [],
    errors: []
  }
```

  * `index` The index starts at 0 when the device powers on for Electromechanical meters, and reflects the actual meter index if using mME. If "E_POS and E_NEG" is activated, this variable will become an object in the format ```{e_pos: 1, e_neg: 2}```    
  * `message_type` type of message  
  * `increments` array containing the index increments. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]``` If "E_POS and E_NEG" is activated you will found two 2-dimensional arrays (first one for OBIS code 1.8.0, second one for OBIS code 2.8.0): ```[[[2024-08-02T19:30:00.000Z, 1],...],[[2024-08-02T19:30:00.000Z, 1],...]]```   
  * `powers` array containing the load curve values in W. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]``` If "E_POS and E_NEG" is activated you will found two 2-dimensional arrays (first one for OBIS code 1.8.0, second one for OBIS code 2.8.0): ```[[[2024-08-02T19:30:00.000Z, 1],...],[[2024-08-02T19:30:00.000Z, 1],...]]```   
  * `indexes` array containing the indexes. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 1],...]``` If "E_POS and E_NEG" is activated you will found two 2-dimensional arrays (first one for OBIS code 1.8.0, second one for OBIS code 2.8.0): ```[[[2024-08-02T19:30:00.000Z, 1],...],[[2024-08-02T19:30:00.000Z, 1],...]]```   
  * `meter_type` "Electromechanical (Position A)" or "mME (Position B)"  
  * `low_battery` 1 means the battery is low / 0 otherwise  
  * `firmware_version` firmware version as an integer  
  * `number_of_starts` number of starts of this sensor  
  * `time_step` number of minutes for each measurement  
  * `scaler_e_pos` scaler for obis code 1.8.0    
  * `scaler_e_sum` scaler for obis code 16.8.0    
  * `scaler_e_neg` scaler for obis code 2.8.0    
  * `obis` "E-POS values (OBIS code 1.8.0)" / "E-SUM values (OBIS code 16.8.0)" / "E-NEG values (OBIS code Z.8.0)" / "E-POS values (OBIS code 1.8.0) and E-NEG values (OBIS code 2.8.0)"    
  * `param_id` NA   
  * `redundancy` when activated, previous increments are repeated (only available in _ap products)  
  * `number_of_values` number of measurement values in each T1 uplink (only available in _ap products)  
  * `sensitivity` 0 = highest sensitivity / 3 = lowest sensitivity (only available in _ap products)
</details>

<details>
<summary><strong>FM432t</strong></summary>
<br>   

Example of `output` JSON Object:

```javascript
    data: {
      message_type : "T1",
      temperatures : [20.12,20.24,23,22.5],        
      meter_type : "Temperature",
      firmware_version: "5.0.2",
      max_temp: 18.5,
      min_temp: 21.5,
      max_temp_variation: 0.5,
      sampling : "average"
    },
    warnings: [],
    errors: []
  }
```

  * `message_type` type of message  
  * `temperatures` array containing the temperatures in °C. If `recvTime` is provided, it will be a 2-dimensional array containing JavaScript Date objects ```[[2024-08-02T19:30:00.000Z, 20.5],...]```.  
  * `meter_type` "Temperature"  
  * `firmware_version` firmware version as a string    
  * `max_temp` maximum temperature recorded in the last 24h    
  * `min_temp` minimum temperature recorded in the last 24h     
  * `max_temp_variation` maximum variation recorded in the last 24h  
  * `sampling` "average" values or "instantaneous"  
</details>

<details>
<summary><strong>TAGAWATT</strong></summary>
<br>   

Example of `output` JSON Object:

```javascript
    data: {
      time_shifting : 0,
      message_type : "T1",        
      tags : [{
        id_tag: 44559,
        id_tag_str: "0000ae0f",
        cumulative_energy: 15226,
      },
      {
        id_tag: 44558,
        id_tag_str: "0000ae0e",
        cumulative_current: 152.26,
      }],
    },
    warnings: [],
    errors: []
  }
```

  * `time_shifting` (integer): Delay in minutes before the data was actually sent (used for time correction, e.g., in case of buffering or transmission delay). A value of 0 means real-time or no shift.
  * `message_type` (string): Type of message. Example: "T1" for standard telemetry.
  * `tags` (array): Array of tag objects (sensors) containing measurement data.
    * `id_tag` (integer): Internal numeric identifier of the tag.
    * `id_tag_str` (string): Hexadecimal string identifier (used in MQTT topics and interfaces).
    * `cumulative_energy ` (integer, optional): Energy in Wh, present only for power tags.  
    * `cumulative_current ` (float, optional): Current in A, present only for current tags.  
    * Tags without `cumulative_energy` or `cumulative_current` are typically voltage tags.  
</details>
