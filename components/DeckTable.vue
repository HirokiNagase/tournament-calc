<template>
  <div class="deck_table">
    <el-table
      :data="deckTableObjects"
      style="width: 100%"
      max-height="400"
      :cell-class-name="tableCellClassName"
      class="table"
    >
      <el-table-column prop="deckName" label="Deck" width="200" />
      <el-table-column sortable prop="share" label="占有率(%)" width="100" />
      <el-table-column
        v-for="(name, index) in deckNames"
        :key="index"
        :prop="index.toString()"
        :label="name"
        width="130"
      />
      <el-table-column label="Operations" width="120">
        <template v-slot="scope">
          <el-button type="text" size="small" @click="edit(scope.$index)">
            Edit
          </el-button>
          <el-button type="text" size="small" @click="deleteDeck(scope.$index)">
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button size="small" round @click="addDeck"> デッキ追加 </el-button>
  </div>
</template>

<script>
export default {
  props: ['deckTableObjects', 'deckNames'],
  methods: {
    edit(index) {
      this.$emit('edit-deck', index)
    },
    deleteDeck(index) {
      this.$emit('delete-deck', index)
    },
    addDeck() {
      this.$emit('add-deck')
    },
    tableCellClassName({ row, column, rowIndex, columnIndex }) {
      if (columnIndex >= 2) {
        const index = (columnIndex - 2).toString()
        const winRate = row[index]
        if (winRate >= 55) {
          return 'advantage'
        } else if (winRate <= 45) {
          return 'disadvantage'
        } else {
          return ''
        }
      }
    },
  },
}
</script>
