<template>
  <canvas class="qr-img" ref="qr"></canvas>
</template>

<script>
import * as QRCode from "qrcode";
export default {
  props: ["qr"],
  watch: {
    qr(newVal, oldVal) {
      this.generate();
    },
  },
  methods: {
    generate() {
      // console.log(this.qr);
      QRCode.toCanvas(
        this.$refs.qr,
        this.qr,
        { errorCorrectionLevel: "M", margin: 2, scale: 3 },
        function (error) {
          if (error) console.error(error);
          console.log("success!");
        }
      );
    },
  },
  mounted() {
    this.generate();
  },
};
</script>


<style lang="less" scoped>
canvas {
  height: 100px !important;
  width: 100px !important;
}
</style>