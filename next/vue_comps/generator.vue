<template>
  <div class="ao-generator">
    <template v-for="(i, j) in ui_elements">
      <component
        v-if="!i.comp"
        v-bind:key="'velem_' + j"
        :is="i.vtype || i.type"
        v-bind:cfg="i.data.cfg"
        v-bind:runtime="i.data.runtime"
        v-bind="i.data.data"
      >
      </component>
      <component
        v-else
        v-bind:key="'velem_' + j"
        :is="i.comp"
        v-bind="i.data"
      >
      </component>
    </template>
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
