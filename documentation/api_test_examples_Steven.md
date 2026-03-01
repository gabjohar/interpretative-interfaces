# API Test Examples - Tasks 2.1 & 2.3

The following examples verify the responses using the sentence `"The cat sat on the mat"`. Additional 2+ inputs are omitted for clarity.

## `/tokenize` example

### Request

```bash
curl -X POST http://localhost:5001/tokenize \
-H "Content-Type: application/json" \
-d '{"text": "The cat sat on the mat"}'
```

### Response

```json
{
  "tokens": [
    {
      "index": 0,
      "token_id": 50256,
      "token_str": "<|endoftext|>"
    },
    {
      "index": 1,
      "token_id": 464,
      "token_str": "The"
    },
    {
      "index": 2,
      "token_id": 3797,
      "token_str": " cat"
    },
    {
      "index": 3,
      "token_id": 3332,
      "token_str": " sat"
    },
    {
      "index": 4,
      "token_id": 319,
      "token_str": " on"
    },
    {
      "index": 5,
      "token_id": 262,
      "token_str": " the"
    },
    {
      "index": 6,
      "token_id": 2603,
      "token_str": " mat"
    }
  ]
}
```

## `/trace` example

### Request
```bash
curl -X POST http://localhost:5001/trace \
-H "Content-Type: application/json" \
-d '{"text": "The cat sat on the mat", "token_indices":[2,3,6]}'
```

### Response

```json
{
  "pca_explained_variance": [
    0.7027655566057073,
    0.09369067744401849
  ],
  "tokens": [
    {
      "index": 2,
      "token_str": " cat"
    },
    {
      "index": 3,
      "token_str": " sat"
    },
    {
      "index": 6,
      "token_str": " mat"
    }
  ],
  "trajectories": {
    "2": [
      {
        "layer": 0,
        "x": -67.85178512180937,
        "y": 9.400095184843194
      },
      {
        "layer": 1,
        "x": -71.14440915752562,
        "y": 11.309658943903264
      },
      {
        "layer": 2,
        "x": -65.84934961037644,
        "y": 17.955194414782063
      },
      {
        "layer": 3,
        "x": -61.886602631769975,
        "y": 23.74106885126471
      },
      {
        "layer": 4,
        "x": -59.11874718373602,
        "y": 27.909566515229496
      },
      {
        "layer": 5,
        "x": -54.603060241208084,
        "y": 33.20844780351618
      },
      {
        "layer": 6,
        "x": -43.77602768283309,
        "y": 42.37283088066382
      },
      {
        "layer": 7,
        "x": -26.388269845177792,
        "y": 55.10568489641977
      },
      {
        "layer": 8,
        "x": -6.843445526135894,
        "y": 72.07460991306264
      },
      {
        "layer": 9,
        "x": 24.47379839656492,
        "y": 89.02316902637357
      },
      {
        "layer": 10,
        "x": 102.44476027409893,
        "y": 116.27679832701608
      },
      {
        "layer": 11,
        "x": 214.94246293352387,
        "y": 95.85003373633756
      }
    ],
    "3": [
      {
        "layer": 0,
        "x": -67.08471428499367,
        "y": -18.51148947230789
      },
      {
        "layer": 1,
        "x": -71.40972862258504,
        "y": -23.059648415140984
      },
      {
        "layer": 2,
        "x": -68.06909839273924,
        "y": -24.365501205466852
      },
      {
        "layer": 3,
        "x": -62.902994130540435,
        "y": -24.804247147854735
      },
      {
        "layer": 4,
        "x": -59.629319011762135,
        "y": -25.620942644222282
      },
      {
        "layer": 5,
        "x": -51.67883871224941,
        "y": -25.2341543681319
      },
      {
        "layer": 6,
        "x": -40.0402482690263,
        "y": -25.350813708145818
      },
      {
        "layer": 7,
        "x": -27.40741451331976,
        "y": -28.24768873467316
      },
      {
        "layer": 8,
        "x": -4.225797252438708,
        "y": -31.52727682978635
      },
      {
        "layer": 9,
        "x": 31.494712441049703,
        "y": -30.88462171820145
      },
      {
        "layer": 10,
        "x": 136.6289370776649,
        "y": -18.03418319542944
      },
      {
        "layer": 11,
        "x": 372.6940473826052,
        "y": -49.558642978847004
      }
    ],
    "6": [
      {
        "layer": 0,
        "x": -71.3547393787758,
        "y": -14.513759906913451
      },
      {
        "layer": 1,
        "x": -73.03973255035065,
        "y": -18.246399114961903
      },
      {
        "layer": 2,
        "x": -69.98641409483781,
        "y": -17.479821495012736
      },
      {
        "layer": 3,
        "x": -68.6587600492656,
        "y": -18.764697775164425
      },
      {
        "layer": 4,
        "x": -64.34441317018947,
        "y": -21.71151683817457
      },
      {
        "layer": 5,
        "x": -54.37007273460355,
        "y": -21.854295019048553
      },
      {
        "layer": 6,
        "x": -39.63010510893654,
        "y": -20.789071850629572
      },
      {
        "layer": 7,
        "x": -21.201654973672827,
        "y": -20.083356275557744
      },
      {
        "layer": 8,
        "x": -3.6841692985658834,
        "y": -19.574903391504286
      },
      {
        "layer": 9,
        "x": 19.311665707779472,
        "y": -25.752713688507065
      },
      {
        "layer": 10,
        "x": 97.27690336898182,
        "y": -21.10993680766275
      },
      {
        "layer": 11,
        "x": 376.912623967156,
        "y": -49.14747591206758
      }
    ]
  }
}
```

## `/predict` example

### Request

```bash
curl -X POST http://localhost:5001/predict \
-H "Content-Type: application/json" \
-d '{"text": "The cat sat on the mat", "token_index":6}'
```

### Response

```json
{
  "predictions_by_layer": [
    {
      "layer": 0,
      "top_tokens": [
        {
          "probability": 0.8294540643692017,
          "token": " mat"
        },
        {
          "probability": 0.08473019301891327,
          "token": "hematically"
        },
        {
          "probability": 0.06996327638626099,
          "token": "rices"
        },
        {
          "probability": 0.005824767518788576,
          "token": "mat"
        },
        {
          "probability": 0.0015927794156596065,
          "token": "ting"
        }
      ]
    },
    {
      "layer": 1,
      "top_tokens": [
        {
          "probability": 0.7609955072402954,
          "token": "rices"
        },
        {
          "probability": 0.12749667465686798,
          "token": "hematically"
        },
        {
          "probability": 0.03948540240526199,
          "token": " mat"
        },
        {
          "probability": 0.01893157884478569,
          "token": "ting"
        },
        {
          "probability": 0.011161230504512787,
          "token": "cher"
        }
      ]
    },
    {
      "layer": 2,
      "top_tokens": [
        {
          "probability": 0.4337306320667267,
          "token": "rices"
        },
        {
          "probability": 0.4209991693496704,
          "token": "hematically"
        },
        {
          "probability": 0.03622985631227493,
          "token": "ting"
        },
        {
          "probability": 0.025842921808362007,
          "token": "imes"
        },
        {
          "probability": 0.016344565898180008,
          "token": "rim"
        }
      ]
    },
    {
      "layer": 3,
      "top_tokens": [
        {
          "probability": 0.5221109986305237,
          "token": "hematically"
        },
        {
          "probability": 0.44603869318962097,
          "token": "rices"
        },
        {
          "probability": 0.006497695576399565,
          "token": "rim"
        },
        {
          "probability": 0.0063015311025083065,
          "token": "ting"
        },
        {
          "probability": 0.005059792660176754,
          "token": "imes"
        }
      ]
    },
    {
      "layer": 4,
      "top_tokens": [
        {
          "probability": 0.7603920102119446,
          "token": "hematically"
        },
        {
          "probability": 0.09207919239997864,
          "token": "ting"
        },
        {
          "probability": 0.0554819218814373,
          "token": "rices"
        },
        {
          "probability": 0.026312338188290596,
          "token": "rim"
        },
        {
          "probability": 0.01985091343522072,
          "token": "ches"
        }
      ]
    },
    {
      "layer": 5,
      "top_tokens": [
        {
          "probability": 0.47454220056533813,
          "token": "hematically"
        },
        {
          "probability": 0.2996132969856262,
          "token": "ting"
        },
        {
          "probability": 0.06437204033136368,
          "token": "ches"
        },
        {
          "probability": 0.04433327540755272,
          "token": "lock"
        },
        {
          "probability": 0.018429432064294815,
          "token": "imes"
        }
      ]
    },
    {
      "layer": 6,
      "top_tokens": [
        {
          "probability": 0.5142094492912292,
          "token": "ting"
        },
        {
          "probability": 0.23778562247753143,
          "token": "ches"
        },
        {
          "probability": 0.11664208769798279,
          "token": "hematically"
        },
        {
          "probability": 0.01423762645572424,
          "token": ","
        },
        {
          "probability": 0.011501187458634377,
          "token": "lock"
        }
      ]
    },
    {
      "layer": 7,
      "top_tokens": [
        {
          "probability": 0.20281361043453217,
          "token": "ting"
        },
        {
          "probability": 0.1696903109550476,
          "token": "ches"
        },
        {
          "probability": 0.09401050955057144,
          "token": ","
        },
        {
          "probability": 0.0821516215801239,
          "token": " at"
        },
        {
          "probability": 0.046683575958013535,
          "token": "hematically"
        }
      ]
    },
    {
      "layer": 8,
      "top_tokens": [
        {
          "probability": 0.3040812015533447,
          "token": " beside"
        },
        {
          "probability": 0.14573705196380615,
          "token": " at"
        },
        {
          "probability": 0.11855842918157578,
          "token": " with"
        },
        {
          "probability": 0.07515735924243927,
          "token": ","
        },
        {
          "probability": 0.03599025681614876,
          "token": " in"
        }
      ]
    },
    {
      "layer": 9,
      "top_tokens": [
        {
          "probability": 0.390726238489151,
          "token": " beside"
        },
        {
          "probability": 0.2494145780801773,
          "token": " with"
        },
        {
          "probability": 0.03734055906534195,
          "token": " at"
        },
        {
          "probability": 0.03482096269726753,
          "token": " while"
        },
        {
          "probability": 0.02409159205853939,
          "token": " in"
        }
      ]
    },
    {
      "layer": 10,
      "top_tokens": [
        {
          "probability": 0.1977682262659073,
          "token": " beside"
        },
        {
          "probability": 0.1712426394224167,
          "token": " with"
        },
        {
          "probability": 0.10606971383094788,
          "token": ","
        },
        {
          "probability": 0.10333040356636047,
          "token": " for"
        },
        {
          "probability": 0.06791543960571289,
          "token": " while"
        }
      ]
    },
    {
      "layer": 11,
      "top_tokens": [
        {
          "probability": 0.17902418971061707,
          "token": ","
        },
        {
          "probability": 0.1202252060174942,
          "token": " and"
        },
        {
          "probability": 0.07351546734571457,
          "token": " in"
        },
        {
          "probability": 0.07134345173835754,
          "token": " with"
        },
        {
          "probability": 0.06867559999227524,
          "token": " for"
        }
      ]
    }
  ],
  "token_index": 6
}
```
