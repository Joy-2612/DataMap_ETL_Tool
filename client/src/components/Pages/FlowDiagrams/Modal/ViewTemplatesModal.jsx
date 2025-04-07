import Modal from "./Modal";
import styles from "../FlowDiagrams.module.css";

const ViewTemplatesModal = ({
  isOpen,
  onClose,
  templates,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.templatesList}>
        <h3>Saved Templates</h3>
        {templates.length === 0 ? (
          <p>No templates saved yet</p>
        ) : (
          <ul>
            {templates.map((template) => (
              <li key={template.id} className={styles.templateItem}>
                <div className={styles.templateInfo}>
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <small>
                    {new Date(template.createdAt).toLocaleString()}
                  </small>
                </div>
                <div className={styles.templateActions}>
                  <button
                    onClick={() => onLoadTemplate(template)}
                    className={styles.loadButton}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ViewTemplatesModal;