<template>
  <div class="ao-generator">
    <component
      v-for="(i, j) in ui_elements"
      v-bind:key="'velem_' + j"
      :is="i.type"
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
}
</style>
