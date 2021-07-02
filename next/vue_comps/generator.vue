<template>
  <div class="ao-generator">
    <component
      v-for="(i, j) in ui_elements"
      v-bind:key="'velem_' + j"
      :is="i.vtype || i.type"
      v-bind:cfg="i.data.cfg"
      v-bind:runtime="i.data.runtime"
      v-bind="i.data.data"
    >
    </component>
  </div>
</template>

<script>
export default {
  props: ["ui_elements"],
};
</script>

<style>
.ao-generator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
</style>
