import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN5Tier1', 'kanji_n5_tier1'),
            buildTab('kanjiN5Tier2', 'kanji_n5_tier2'),
            buildTab('kanjiN5Tier3', 'kanji_n5_tier3'),
        ]}
    />
)

export default KanjiLayout
