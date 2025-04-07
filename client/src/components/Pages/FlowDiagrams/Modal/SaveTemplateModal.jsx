import { useState } from "react";
import Modal from "./Modal";
import styles from "../FlowDiagrams.module.css";

const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const handleSave = () => {
    if (!templateName.trim()) return;
    onSave(templateName, templateDescription);
    setTemplateName("");
    setTemplateDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.templateForm}>
        <h3>Save as Template</h3>
        <div className={styles.formGroup}>
          <label>Template Name *</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Enter template description"
          />
        </div>
        <button onClick={handleSave} className={styles.saveButton}>
          Save Template
        </button>
      </div>
    </Modal>
  );
};

export default SaveTemplateModal;