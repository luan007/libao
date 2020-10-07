<template>
<div class="ao-mounter">
    <component v-for="q in ui" :is="q.kind" v-bind="q"></component>
</div>
</template>

<script>
export default {
    props: ["ui"],
};
</script>

<style>
.ao-mounter {}
</style>
