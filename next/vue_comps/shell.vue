<template>
  <div
    v-if="cfg.disp"
    v-bind:class="{
      show: cfg.show,
      shell: true,
    }"
    v-bind:style="{
      transform: `translate(${cfg.offset.x || 0}px, ${cfg.offset.y || 0}px)`,
    }"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: ["cfg"],
};
</script>

<style lang="less">
.top {
  transform: translateY(-130%);
}

.scale {
  transform: scale(0, 0);
  transform-origin: 50% 50%;
}

.left {
  transform: translateX(-60%);
}

.right {
  transform: translateX(60%);
}

.bottom {
  transform: translateY(130%);
}
.fade {
  opacity: 0;
}

.shell {
  position: absolute;
  .t-slide {
    transition: transform 0.6s ease-in, opacity 0.2s ease;
  }
  .t-slide-slow {
    transition: transform 0.6s ease-in, opacity 0.2s ease;
  }
  .t {
    transition: transform 0.6s ease-in, opacity 0.2s ease;
  }

  &.show {
    .t-slide {
      transition: transform 1.8s cubic-bezier(0, 0.87, 0, 1.01),
        opacity 1.2s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    .t-slide-slow {
      transition: transform 2.5s cubic-bezier(0, 0.87, 0, 1.01),
        opacity 2s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    .top,
    .left,
    .right,
    .bottom {
      transform: translateX(0px) translateY(0px);
    }
    .scale {
      transform: scale(1, 1);
    }
    .fade {
      opacity: 1;
    }

    .hide {
      &.hide_op {
        opacity: 0;
      }

      .t-slide {
        transition: all 0.2s ease-in;
      }
      .t {
        transition: all 0.3s ease;
      }
      .fade {
        opacity: 0;
      }
      .top {
        transform: translateY(-130%);
      }

      .scale {
        transform: scale(0, 0);
        transform-origin: 50% 50%;
      }

      .left {
        transform: translateX(-60%);
      }

      .right {
        transform: translateX(60%);
      }

      .bottom {
        transform: translateY(130%);
      }
    }
  }
}
</style>