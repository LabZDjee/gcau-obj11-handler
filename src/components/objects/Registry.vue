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
      <div class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">ProjectReference</div>
          <div class="column">
            <b-field>
              <b-input
                v-model="attributes.ProjectReference"
                @input="gotInput('ProjectReference', $event)"
                maxlength="16"
              ></b-input>
            </b-field>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { makeObjectFrom } from "../../util";

export default {
  props: {},
  computed: {
    objectName() {
      return `REGISTRY`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getRegistry;
      return { ...rawAttributes };
    },
  },
  methods: {
    gotInput(from, value) {
      this.$store.commit("storeValues", {
        objectName: this.objectName,
        values: makeObjectFrom(from, value),
      });
    },
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>
