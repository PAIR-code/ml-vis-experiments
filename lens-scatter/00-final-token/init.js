/* Copyright 2021 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/



window.init = function(){
  console.clear()

  if (!window.data){
    window.data = loader.unpack_obj(window.rawdata)
  }
  data.vocabStr = data.vocab.map((d, i) => util.decodeToken(i))

  var sel = d3.select('.graph').html(``)

  // Add inputs
  data.inputs = data.input_ids.map(id => ({str: util.decodeToken(id), id}))
  data.inputs.at(data.token_index).isActive = true
  sel.append('div.input-tokens')
    .appendMany('div.token', data.inputs)
    .text(d => d.str)
    .classed('is-active', d => d.isActive)



  // Adds Scatter plots
  var l0 = 10
  var l1 = 20
  var pair = {
    e0: Array.from(data.layers[l0].data),
    e1: Array.from(data.layers[l1].data),
    label0: `layer ${l0}`,
    label1: `layer ${l1}`,
    vocab: data.vocabStr,
  }
  var pair = window.initPair(pair, sel.append('div'))

}
window.init()


