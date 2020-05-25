<template>
  <div id="app">
    <div ref="objectSelector" class="box object-selector">
      <resize-observer @notify="handleSelectorResize" />
      <div class="panel">
        <div class="panel-block">
          <div class="columns is-multiline">
            <div class="column">
              <b-checkbox size="is-default" v-model="anixDisplayed">ANIX</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" v-model="commun2Displayed">COMMUN2</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" v-model="equctrlDisplayed">EQCTRL</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" v-model="eqEvtDisplayed">EQ/EVT</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" v-model="registryDisplayed">REGISTRY</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" v-model="sysvarDisplayed">SYSVAR</b-checkbox>
            </div>
            <div class="column">
              <b-checkbox size="is-default" electron:erve v-model="systexDisplayed">SYSTEX</b-checkbox>
            </div>
            <div class="column is-2">
              <b-button :expanded="true" @click="setNoDisplay">none</b-button>
            </div>
            <div class="column is-2">
              <b-button :expanded="true" @click="setAllDisplay">all</b-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div :style="{ top: areaOfObjectsTop }" class="area-of-objects">
      <div v-show="anixDisplayed" v-for="i in 4" :key="`anix-${i}`">
        <anix :instance="i.toString(10)"></anix>
      </div>
      <commun2 v-show="commun2Displayed"></commun2>
      <eqctrl v-show="equctrlDisplayed"></eqctrl>
      <div v-show="eqEvtDisplayed" v-for="i in 8" :key="`eq-evt-${i}`">
        <eq :instance="(i + 16).toString(10)" />
        <evt :instance="(i + 48).toString(10)" />
      </div>
      <registry v-show="registryDisplayed"></registry>
      <systex v-show="systexDisplayed"></systex>
      <sysvar v-show="sysvarDisplayed"></sysvar>
    </div>
  </div>
</template>

<script>
import Anix from "./components/objects/Anix";
import Commun2 from "./components/objects/Commun2";
import Eq from "./components/objects/Eq";
import Eqctrl from "./components/objects/Eqctrl";
import Evt from "./components/objects/Evt";
import Registry from "./components/objects/Registry";
import Systex from "./components/objects/Systex";
import Sysvar from "./components/objects/Sysvar";

export default {
  name: "App",
  data: function() {
    return {
      anixDisplayed: true,
      commun2Displayed: true,
      equctrlDisplayed: true,
      eqEvtDisplayed: true,
      registryDisplayed: true,
      systexDisplayed: true,
      sysvarDisplayed: true,
      areaOfObjectsTop: "150px",
    };
  },
  components: {
    Anix,
    Commun2,
    Eq,
    Eqctrl,
    Evt,
    Registry,
    Systex,
    Sysvar,
  },
  methods: {
    handleSelectorResize({ height }) {
      this.areaOfObjectsTop = `${height}px`;
    },
    setNoDisplay() {
      this.anixDisplayed = false;
      this.commun2Displayed = false;
      this.equctrlDisplayed = false;
      this.eqEvtDisplayed = false;
      this.registryDisplayed = false;
      this.systexDisplayed = false;
      this.sysvarDisplayed = false;
    },
    setAllDisplay() {
      this.anixDisplayed = true;
      this.commun2Displayed = true;
      this.equctrlDisplayed = true;
      this.eqEvtDisplayed = true;
      this.registryDisplayed = true;
      this.systexDisplayed = true;
      this.sysvarDisplayed = true;
    },
  },
  mounted() {
    const rect = this.$refs.objectSelector.getBoundingClientRect();
    this.areaOfObjectsTop = `${rect.height}px`;
  },
};
</script>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #8c67ef;
$primary-invert: findColorInvert($primary);
$twitter: #4099ff;
$twitter-invert: findColorInvert($twitter);

$card-header-color: blue;

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  "white": (
    $white,
    $black,
  ),
  "black": (
    $black,
    $white,
  ),
  "light": (
    $light,
    $light-invert,
  ),
  "dark": (
    $dark,
    $dark-invert,
  ),
  "primary": (
    $primary,
    $primary-invert,
  ),
  "info": (
    $info,
    $info-invert,
  ),
  "success": (
    $success,
    $success-invert,
  ),
  "warning": (
    $warning,
    $warning-invert,
  ),
  "danger": (
    $danger,
    $danger-invert,
  ),
  "twitter": (
    $twitter,
    $twitter-invert,
  ),
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// breakpoints
$tablet: 400px;

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.is-vertical-center {
  display: flex;
  align-items: center;
}

.min-width-number-input {
  min-width: 200px;
}

.object-selector {
  position: fixed;
  top: 0;
  min-width: 100%;
}

.area-of-objects {
  position: absolute;
  top: 120px;
  z-index: -1;
  min-width: 100%;
  background-color: snow;
}
</style>
