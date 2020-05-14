<template>
  <div class="box">
    <div class="panel">
      <div class="panel-heading">
        <div class="columns">
          <div class="column is-vertical-center is-1">
            <b-icon type="is-info" pack="fas" icon="folder" size="is-small"></b-icon>
          </div>
          <div class="column is-2">
            <b-tag type="is-info">{{ objectName }}</b-tag>
          </div>
          <div class="column is-2">
            <b-button @click="setDefault">default</b-button>
          </div>
        </div>
      </div>
      <hex-byte :object="objectName" attribute="EventEnableMsb" :bitfieldDef="evtNameList"></hex-byte>
    </div>
  </div>
</template>

<script>
import HexByte from "../basic/HexByte";

export default {
  components: { HexByte },
  computed: {
    objectName() {
      return `SYSVAR`;
    },
    evtNameList() {
      return ["EVT_49", "EVT_50", "EVT_51", "EVT_52", "EVT_53", "EVT_54", "EVT_55", "EVT_56"];
    },
  },
  methods: {
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>
